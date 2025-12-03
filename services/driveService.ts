
const API_KEY = process.env.API_KEY;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Ensure this is set in your env variables

// Scope for reading Drive files
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export const isDriveAvailable = !!CLIENT_ID;

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let pickerApiLoaded = false;
let oauthToken: string | null = null;

/**
 * Loads the Google API scripts if they aren't already initialized.
 */
const loadGoogleScripts = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (pickerApiLoaded && oauthToken) {
      resolve();
      return;
    }

    const gapiLoaded = () => {
      window.gapi.load('picker', {
        callback: () => {
          pickerApiLoaded = true;
          checkAuth();
        },
      });
    };

    const checkAuth = () => {
      if (oauthToken) {
        resolve();
        return;
      }
      
      if (!window.google || !window.google.accounts) {
        // Wait for GSI script
        setTimeout(checkAuth, 100);
        return;
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error !== undefined) {
            reject(response);
            return;
          }
          oauthToken = response.access_token;
          resolve();
        },
      });

      if (oauthToken === null) {
        // Trigger OAuth popup
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    };

    if (window.gapi) {
      gapiLoaded();
    } else {
      // Wait for script to load
      const checkGapi = setInterval(() => {
        if (window.gapi) {
          clearInterval(checkGapi);
          gapiLoaded();
        }
      }, 100);
    }
  });
};

/**
 * Opens the Google Drive Picker and returns the content of the selected file.
 */
export const pickFromDrive = async (): Promise<string> => {
  if (!CLIENT_ID) {
    throw new Error("Google Client ID is missing. Please add GOOGLE_CLIENT_ID to your environment variables.");
  }

  await loadGoogleScripts();

  return new Promise((resolve, reject) => {
    const pickerCallback = async (data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const fileId = data.docs[0].id;
        const fileName = data.docs[0].name;
        
        try {
          const content = await downloadFile(fileId);
          resolve(content);
        } catch (error) {
          console.error("Error downloading file", error);
          reject(new Error(`Failed to download ${fileName}`));
        }
      } else if (data.action === window.google.picker.Action.CANCEL) {
        reject(new Error("Selection cancelled"));
      }
    };

    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
    view.setMimeTypes("application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain");

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .setAppId(CLIENT_ID)
      .setOAuthToken(oauthToken!)
      .addView(view)
      .setDeveloperKey(API_KEY!)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  });
};

const downloadFile = async (fileId: string): Promise<string> => {
  if (!oauthToken) throw new Error("No OAuth token available");

  // 1. Fetch file metadata to determine type and name
  const metaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,name`, {
    headers: { Authorization: `Bearer ${oauthToken}` }
  });
  
  if (!metaResponse.ok) {
    throw new Error("Failed to fetch file metadata");
  }
  
  const meta = await metaResponse.json();
  
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  let mimeType = meta.mimeType;
  let fileName = meta.name;
  
  // 2. Handle Google Docs specifically by exporting them
  if (mimeType === 'application/vnd.google-apps.document') {
    // Export Google Docs to plain text
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    mimeType = 'text/plain';
    // Append .txt to ensure downstream parsers recognize it as text
    if (!fileName.toLowerCase().endsWith('.txt')) {
      fileName += '.txt';
    }
  }

  // 3. Fetch the file content (binary or text)
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${oauthToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch file content from Drive");
  }

  const blob = await response.blob();
  
  // 4. Create a File object
  // We create a proper File object here so that the existing fileParser.ts logic
  // can handle it uniformly (whether it's a PDF blob, DOCX blob, or Text blob).
  const file = new File([blob], fileName, { type: mimeType });
  
  // We throw the file object to be caught by the caller in InputArea.tsx
  // This preserves the existing error-flow pattern for returning files.
  throw { file };
};
