import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getTelegramWebApp, type TelegramWebAppUser } from "./telegram";
import { user as mockUser } from "./mock";

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

  // Telegram's SDK only exists in the browser, so reading it after mount keeps
  // SSR and the first client render identical (mock user) — no hydration drift.
  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.ready();
      webApp.expand();
      setTelegramUser(webApp.initDataUnsafe?.user ?? null);
    }
    setReady(true);
  }, []);

  const value = useMemo<TelegramAuthState>(
    () => ({
      telegramUser,
      ready,
      isTelegram: telegramUser != null,
      user: buildUser(telegramUser),
    }),
    [telegramUser, ready],
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
