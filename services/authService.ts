
import { User } from "../types";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google: any;
  }
}

/**
 * Decodes a JWT token (ID token) to extract user information.
 * Note: In a production environment with a backend, verify the token on the server.
 */
const decodeJwt = (token: string): User | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    
    return {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch (error) {
    console.error("Failed to decode JWT", error);
    return null;
  }
};

/**
 * Initializes the Google Identity Services script and renders the button.
 */
export const initGoogleAuth = (onSuccess: (user: User) => void): void => {
  if (!CLIENT_ID) {
    console.warn("Google Client ID is missing. Auth disabled.");
    return;
  }

  const initialize = () => {
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response: any) => {
        if (response.credential) {
          const user = decodeJwt(response.credential);
          if (user) {
            onSuccess(user);
          }
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the standard Google Sign In button into a specific div
    const buttonContainer = document.getElementById('google-signin-btn');
    if (buttonContainer) {
      window.google.accounts.id.renderButton(
        buttonContainer,
        { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with' }  // customization
      );
    }
  };

  // Check if script is already loaded
  if (window.google?.accounts?.id) {
    initialize();
  } else {
    // Wait for script (it's loaded async in index.html)
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        initialize();
      }
    }, 100);
  }
};

export const promptOneTap = () => {
   if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
   }
};
