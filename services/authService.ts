
import { User } from "../types";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const STORAGE_KEY = 'ats_optima_user';

// Mock user for demo mode
const MOCK_USER: User = {
  name: "Demo User",
  email: "demo@faangresumeiq.com",
  picture: "", // Will fall back to initial
  sub: "demo-123",
  exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
};

declare global {
  interface Window {
    google: any;
  }
}

/**
 * Decodes a JWT token (ID token) to extract user information.
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
      exp: payload.exp
    };
  } catch (error) {
    console.error("Failed to decode JWT", error);
    return null;
  }
};

/**
 * Retrieves the currently logged-in user from storage, checking for expiration.
 */
export const getStoredUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const user: User = JSON.parse(stored);
    // Check expiration if present
    if (user.exp && Date.now() >= user.exp * 1000) {
      console.warn("Session expired");
      logoutUser();
      return null;
    }
    return user;
  } catch (e) {
    return null;
  }
};

/**
 * Saves the user to local storage.
 */
export const setStoredUser = (user: User) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

/**
 * Logs out the user, clearing storage and revoking Google session if possible.
 */
export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEY);
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
};

/**
 * Initializes the Google Identity Services script and renders the button.
 * Falls back to Demo Mode if no Client ID is present.
 */
export const initGoogleAuth = (onSuccess: (user: User) => void): void => {
  const buttonContainer = document.getElementById('google-signin-btn');

  // MODE 1: Demo Mode (No Client ID)
  if (!CLIENT_ID) {
    if (buttonContainer) {
      // Avoid re-rendering if already there
      if (buttonContainer.hasChildNodes()) return;

      console.warn("Google Client ID missing. Rendering Demo Sign-In.");
      buttonContainer.innerHTML = ''; // Clear existing
      
      const button = document.createElement('button');
      button.type = 'button';
      button.className = "flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-300 rounded-full font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm";
      button.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in (Demo)
      `;
      button.onclick = () => {
        setStoredUser(MOCK_USER);
        onSuccess(MOCK_USER);
      };
      buttonContainer.appendChild(button);
    }
    return;
  }

  // MODE 2: Real Google Auth
  const initialize = () => {
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response: any) => {
        if (response.credential) {
          const user = decodeJwt(response.credential);
          if (user) {
            setStoredUser(user);
            onSuccess(user);
          }
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    if (buttonContainer) {
      window.google.accounts.id.renderButton(
        buttonContainer,
        { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with' }
      );
    }
  };

  if (window.google?.accounts?.id) {
    initialize();
  } else {
    // Retry mechanism for loading the script
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        initialize();
      }
    }, 100);
    // Timeout to stop retrying after 5 seconds
    setTimeout(() => clearInterval(interval), 5000);
  }
};

export const promptOneTap = () => {
   if (CLIENT_ID && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
   }
};
