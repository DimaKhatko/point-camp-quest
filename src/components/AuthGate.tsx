import type { ReactNode } from "react";

import { useTelegramAuth } from "../lib/telegram-auth";
import type { AppEntryResult } from "../lib/app-entry";

// Admin username shown on the "awaiting verification" screen. Public info, so
// it's a client-exposed (VITE_-prefixed) env var, not a secret.
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME ?? "the_admin";

export type GateView = "app" | "loading" | "error" | "pending" | "rejected";

/**
 * Pure gate decision. Returns "loading" ONLY while inside Telegram and the
 * entry flow hasn't reached a terminal state — so once `entryResolved` is true
 * (which the provider guarantees in every path) it can never return "loading".
 */
export function resolveGateView(state: {
  isTelegram: boolean;
  entryLoading: boolean;
  entryResolved: boolean;
  entry: AppEntryResult | null;
}): GateView {
  // Not inside Telegram — render the app as-is (dev / preview).
  if (!state.isTelegram) return "app";
  // Still resolving; gated strictly on the terminal flag, never on `entry`.
  if (!state.entryResolved || state.entryLoading) return "loading";
  // Resolved but no verified entry → couldn't verify (empty initData / error).
  if (state.entry === null) return "error";
  if (state.entry.status === "pending") return "pending";
  if (state.entry.status === "rejected") return "rejected";
  return "app"; // active
}

/**
 * Gates the app by server-verified status. Intentionally minimal / unstyled.
 *
 * - Outside Telegram (browser/dev): no gating — the app stays usable.
 * - pending  → "awaiting verification" (clan/leaderboard/points stay locked
 *   because the whole app is behind this gate while house == null).
 * - rejected → neutral "access closed".
 * - active   → render the app.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isTelegram, entry, entryLoading, entryResolved } = useTelegramAuth();
  const view = resolveGateView({ isTelegram, entryLoading, entryResolved, entry });

  switch (view) {
    case "loading":
      return <div>Loading…</div>;
    case "error":
      // Definite state, not a hang: session couldn't be verified (empty
      // initData, or enterApp failed).
      return (
        <div>
          <h1>Couldn't verify your session</h1>
          <p>Please reopen the app from @{ADMIN_USERNAME}'s bot.</p>
        </div>
      );
    case "pending":
      return (
        <div>
          <h1>Awaiting verification</h1>
          <p>Message @{ADMIN_USERNAME} to get verified.</p>
        </div>
      );
    case "rejected":
      return (
        <div>
          <h1>Access closed</h1>
        </div>
      );
    case "app":
      return <>{children}</>;
  }
}
