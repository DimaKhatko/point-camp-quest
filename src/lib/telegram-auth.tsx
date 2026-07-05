import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getTelegramWebApp, type TelegramWebAppUser } from "./telegram";
import { user as mockUser } from "./mock";
import type { AppEntryResult } from "./app-entry";
import { enterApp } from "../server/entry";

// The app user: identity comes from Telegram when available, gamification
// stats stay mocked for now (those would come from our own backend later).
export interface AuthUser {
  id: string;
  name: string;
  initial: string;
  username?: string;
  photoUrl?: string;
  clan: typeof mockUser.clan;
  balance: number;
  karma: number;
  tier: string;
  seasons: number;
}

interface TelegramAuthState {
  /** Raw Telegram user, or null when not running inside Telegram. */
  telegramUser: TelegramWebAppUser | null;
  /** True once the client has checked for the Telegram WebApp. */
  ready: boolean;
  /** True when running inside the Telegram Mini App environment. */
  isTelegram: boolean;
  /** Current app user — Telegram identity merged with mock stats. */
  user: AuthUser;
  /** Raw signed initData string to pass to server functions, or null. */
  initData: string | null;
  /** Server-verified entry result (status + House), or null until resolved. */
  entry: AppEntryResult | null;
  /** True while the server-side first-login call is in flight. */
  entryLoading: boolean;
}

const TelegramAuthContext = createContext<TelegramAuthState | null>(null);

function buildUser(tgUser: TelegramWebAppUser | null): AuthUser {
  // Gamification stats are mocked until a real backend exists.
  const stats = {
    clan: mockUser.clan,
    balance: mockUser.balance,
    karma: mockUser.karma,
    tier: mockUser.tier,
    seasons: mockUser.seasons,
  };

  if (!tgUser) {
    return { id: "mock", name: mockUser.name, initial: mockUser.initial, ...stats };
  }

  const name =
    [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() ||
    tgUser.username ||
    "Camper";

  return {
    id: String(tgUser.id),
    name,
    initial: (tgUser.first_name?.[0] ?? name[0] ?? "?").toUpperCase(),
    username: tgUser.username,
    photoUrl: tgUser.photo_url,
    ...stats,
  };
}

export function TelegramAuthProvider({ children }: { children: ReactNode }) {
  const [telegramUser, setTelegramUser] = useState<TelegramWebAppUser | null>(null);
  const [ready, setReady] = useState(false);
  const [initData, setInitData] = useState<string | null>(null);
  const [entry, setEntry] = useState<AppEntryResult | null>(null);
  const [entryLoading, setEntryLoading] = useState(false);

  // Telegram's SDK only exists in the browser, so reading it after mount keeps
  // SSR and the first client render identical (mock user) — no hydration drift.
  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.ready();
      webApp.expand();
      setTelegramUser(webApp.initDataUnsafe?.user ?? null);
      setInitData(webApp.initData || null);

      // Run the server-side first-login flow with the signed initData. This
      // registers the user and resolves their status/House. The client never
      // writes to Firestore — only this server function does.
      if (webApp.initData) {
        setEntryLoading(true);
        enterApp({ data: webApp.initData })
          .then((result) => setEntry(result))
          .catch(() => setEntry(null))
          .finally(() => setEntryLoading(false));
      }
    }
    setReady(true);
  }, []);

  const value = useMemo<TelegramAuthState>(
    () => ({
      telegramUser,
      ready,
      isTelegram: telegramUser != null,
      user: buildUser(telegramUser),
      initData,
      entry,
      entryLoading,
    }),
    [telegramUser, ready, initData, entry, entryLoading],
  );

  return <TelegramAuthContext.Provider value={value}>{children}</TelegramAuthContext.Provider>;
}

export function useTelegramAuth(): TelegramAuthState {
  const ctx = useContext(TelegramAuthContext);
  if (!ctx) {
    throw new Error("useTelegramAuth must be used within a TelegramAuthProvider");
  }
  return ctx;
}

/** Convenience hook for the current app user. */
export function useCurrentUser(): AuthUser {
  return useTelegramAuth().user;
}
