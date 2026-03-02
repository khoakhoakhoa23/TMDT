/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_FACEBOOK_APP_ID: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_MAPBOX_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Window interface for Facebook SDK
interface Window {
  FB: {
    init: (config: {
      appId: string;
      cookie: boolean;
      xfbml: boolean;
      version: string;
    }) => void;
    login: (callback: (response: { authResponse: { accessToken: string } }) => void, config: { scope: string; return_scopes: boolean }) => void;
    logout: (callback: () => void) => void;
    api: (path: string, callback: (response: unknown) => void) => void;
  };
  // Leaflet
  L: typeof import("leaflet");
}
