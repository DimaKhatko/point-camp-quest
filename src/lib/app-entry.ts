// Shared, runtime-free types for the app-entry / House-assignment flow.
// Safe to import from BOTH client and server — no server-only dependencies.

export type House = "circles" | "spikes";
export type UserStatus = "pending" | "active" | "rejected";

/** Result of the first-login / entry flow, returned to the client. */
export interface AppEntryResult {
  status: UserStatus;
  house: House | null;
}

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
