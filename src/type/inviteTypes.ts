// src/type/inviteTypes.ts

import { Discipline } from "../generated/prisma/enums";

export type ActionResponse<T = unknown> = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: T | null;
};

export type AthleteProfileSnippet = {
  displayName: string | null;
  locationCity: string | null;
} | null;

export type UserSnippet = {
  id: string;
  name: string | null;
  athleteProfile: AthleteProfileSnippet;
};

export type TeamSnippet = {
  id: string;
  name: string;
  status: string;
};

export type ReceivedInvite = {
  id: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  role: Discipline;
  status: string;
  createdAt: string;
  updatedAt: string;
  team: TeamSnippet | null;
  fromUser: UserSnippet;
};

export type SentInvite = {
  id: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  role: Discipline;
  status: string;
  createdAt: string;
  updatedAt: string;
  team: TeamSnippet | null;
  toUser: UserSnippet;
  fromUser: UserSnippet;
};

// ─── NEW: typed data envelope returned by getInvites ─────────────────────────

export type InvitesData = {
  received: ReceivedInvite[];
  sent: SentInvite[];
  sentDeclined: SentInvite[]; // ← NEW: sent invites the recipient declined
  accepted: ReceivedInvite[];
  rejected: ReceivedInvite[];
};
// ─── ACTION PAYLOADS ─────────────────────────────────────────────────────────

export type InviteActionPayload =
  | { service: "GET_INVITES" }
  | { service: "MARK_AS_READ" }
  | { service: "SEND_INVITE"; toUserId: string; role: Discipline }
  | { service: "ACCEPT_INVITE"; inviteId: string }
  | { service: "REJECT_INVITE"; inviteId: string }
  | { service: "REVOKE_INVITE"; inviteId: string };
