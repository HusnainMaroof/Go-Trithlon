// src/type/inviteTypes.ts

import { Discipline } from "../generated/prisma/enums";

// ─── SHARED RESPONSE ─────────────────────────────────────────────────────────

export type ActionResponse<T = unknown> = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: T | null;
};

// ─── SNIPPETS ─────────────────────────────────────────────────────────────────

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

// ─── INVITE SHAPES ────────────────────────────────────────────────────────────

export type ReceivedInvite = {
  id: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  role: Discipline;
  status: string;
  createdAt: string;
  updatedAt: string;
  team: TeamSnippet;
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
  team: TeamSnippet;
  toUser: UserSnippet;
  fromUser: UserSnippet;
};



// ─── ACTION PAYLOADS ──────────────────────────────────────────────────────────

export type GetInvitesPayload = { service: "GET_INVITES" };
export type SendInvitePayload = {
  service: "SEND_INVITE";
  toUserId: string;
  role: Discipline;
};
export type AcceptInvitePayload = {
  service: "ACCEPT_INVITE";
  inviteId: string;
};
export type RejectInvitePayload = {
  service: "REJECT_INVITE";
  inviteId: string;
};
export type RevokeInvitePayload = {
  service: "REVOKE_INVITE";
  inviteId: string;
};

export type InviteActionPayload =
  | { service: "GET_INVITES" }
  | { service: "SEND_INVITE"; toUserId: string; role: Discipline }
  | { service: "ACCEPT_INVITE"; inviteId: string }
  | { service: "REJECT_INVITE"; inviteId: string }
  | { service: "REVOKE_INVITE"; inviteId: string };


