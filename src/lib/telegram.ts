// Minimal typings + accessor for the Telegram Mini App (WebApp) SDK.
//
// The SDK is injected by https://telegram.org/js/telegram-web-app.js and is
// only available in the browser, inside the Telegram client. This file covers
// just the subset of the surface this prototype touches.
//
// NOTE: This is prototype-level integration. `initDataUnsafe` is read directly
// and is NOT cryptographically verified. Before trusting the user server-side,
// validate `initData` against the bot token (HMAC) on the backend.

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface TelegramWebApp {
  /** Signed init data string — verify this server-side before trusting it. */
  initData: string;
  /** Parsed init data. "Unsafe" because it isn't verified on the client. */
  initDataUnsafe: {
    user?: TelegramWebAppUser;
    auth_date?: number;
    hash?: string;
    [key: string]: unknown;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  /** Notifies the Telegram client the Mini App is ready to be displayed. */
  ready: () => void;
  /** Expands the Mini App to the full available height. */
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/** Returns the Telegram WebApp instance, or null outside the Telegram client. */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}
