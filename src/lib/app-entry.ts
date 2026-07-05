// Shared, runtime-free types for the app-entry / House-assignment flow.
// Safe to import from BOTH client and server — no server-only dependencies.

export type House = "circles" | "spikes";
export type UserStatus = "pending" | "active" | "rejected";

/** Result of the first-login / entry flow, returned to the client. */
export interface AppEntryResult {
  status: UserStatus;
  house: House | null;
}

/**
 * Coarse, client-facing failure reason for the entry flow. Deliberately
 * distinguishable so it can be shown on the error screen for on-device
 * diagnosis. The server maps its finer-grained internal failure to one of these.
 */
export type EntryFailureReason =
  | "invalid_signature"
  | "empty_init_data"
  | "stale"
  | "no_token"
  | "firebase_init_failed";

/** Structured response from `enterApp` — either a verified result or a reason. */
export type EntryResponse =
  | ({ ok: true } & AppEntryResult)
  | {
      ok: false;
      reason: EntryFailureReason;
      /** Short, non-secret hint (e.g. an error message) shown for diagnosis. */
      detail?: string;
    };

/** A pending user as shown in the admin verification queue. */
export interface PendingUser {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  createdAt: number; // epoch millis
}

/** Admin actions available on a pending user. */
export type AdminAction = "confirm_house" | "admit_newcomer" | "reject";
