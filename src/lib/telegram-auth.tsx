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
  /**
   * True once the entry flow has reached a terminal state — success, error, OR
   * missing/empty initData. The gate uses this so it can never hang: a null
   * `entry` after `entryResolved` means "couldn't verify" (an error state),
   * not "still loading".
   */
  entryResolved: boolean;
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
  const [entryResolved, setEntryResolved] = useState(false);

  // Telegram's SDK only exists in the browser, so reading it after mount keeps
  // SSR and the first client render identical (mock user) — no hydration drift.
  useEffect(() => {
    console.log("[auth] provider mounted");
    const webApp = getTelegramWebApp();

    if (!webApp) {
      console.log("[auth] no Telegram WebApp — running outside Telegram");
      setReady(true);
      return;
    }

    // Read identity + signed initData up front, then set state, so a throw from
    // ready()/expand() can never strand us before the state is populated.
    const tgUser = webApp.initDataUnsafe?.user ?? null;
    const rawInitData = webApp.initData || "";
    console.log(
      `[auth] Telegram WebApp present — user id: ${tgUser?.id ?? "none"}, initData length: ${rawInitData.length}`,
    );

    setTelegramUser(tgUser);
    setInitData(rawInitData || null);
    setReady(true);

    try {
      webApp.ready();
      webApp.expand();
      console.log("[auth] called WebApp.ready()/expand()");
    } catch (err) {
      console.warn("[auth] WebApp.ready()/expand() threw", err);
    }

    // Without a signed initData string we cannot verify the session. Resolve to
    // a definite (error) state instead of hanging the gate on "Loading".
    if (!rawInitData) {
      console.warn("[auth] initData is empty — cannot verify; resolving to error state");
      setEntryResolved(true);
      return;
    }

    // Run the server-side first-login flow with the signed initData. This
    // registers the user and resolves their status/House. The client never
    // writes to Firestore — only this server function does.
    console.log("[auth] calling enterApp…");
    setEntryLoading(true);

    let settled = false;
    const finalize = () => {
      // Terminal in every case — the gate always leaves the loading state.
      setEntryLoading(false);
      setEntryResolved(true);
    };
    // Safety net: if the request never settles (hung network), resolve anyway
    // so the gate can't stay on "Loading" indefinitely.
    const timer = setTimeout(() => {
      if (settled) return;
      console.error("[auth] enterApp timed out after 12s — resolving to error state");
      finalize();
    }, 12000);

    enterApp({ data: rawInitData })
      .then((result) => {
        console.log("[auth] enterApp resolved:", result);
        setEntry(result);
      })
      .catch((err) => {
        console.error("[auth] enterApp failed:", err);
        setEntry(null);
      })
      .finally(() => {
        settled = true;
        clearTimeout(timer);
        console.log("[auth] enterApp settled");
        finalize();
      });
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
      entryResolved,
    }),
    [telegramUser, ready, initData, entry, entryLoading, entryResolved],
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
