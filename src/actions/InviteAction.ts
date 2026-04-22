// actions/inviteAction.ts
"use server";

import { getCurrentUser } from "../lib/auth";
import { getAuthSession } from "../utlis/helper";
import { catchErrors } from "../utlis/ErrorWrapper";
import { ActionResponse, InviteActionPayload } from "../type/inviteTypes";
import { inviteService } from "../service/invite.service";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function resolveUserId(): Promise<string | null> {
  try {
    const getUser = await getCurrentUser();
    const sessionId = getUser.authsuccess.data.sessionId;
    const userData = await getAuthSession({ sessionId });
    return userData?.data?.userId ?? null;
  } catch {
    return null;
  }
}

const noSession = (): ActionResponse => ({
  success: false,
  error: true,
  message: "No session data.",
  data: null,
});

const unknownService = (): ActionResponse => ({
  success: false,
  error: true,
  message: "Unknown service.",
  data: null,
});

// ─── UNIFIED ACTION ───────────────────────────────────────────────────────────

export const inviteAction = catchErrors(
  async (
    _prevState: ActionResponse,
    payload: InviteActionPayload,
  ): Promise<ActionResponse> => {
    if (!payload?.service) {
      return {
        success: false,
        error: true,
        message: "No service specified.",
        data: null,
      };
    }

    const userId = await resolveUserId();
    if (!userId) return noSession();

    switch (payload.service) {
      case "GET_INVITES": {
        const data = await inviteService.getInvites(userId);
        return { success: true, error: false, message: null, data };
      }

      case "SEND_INVITE": {
        await inviteService.sendInvite(userId, {
          toUserId: payload.toUserId,
          role: payload.role,
        });
        return {
          success: true,
          error: false,
          message: "Invite sent successfully.",
          data: null,
        };
      }

      case "ACCEPT_INVITE": {
        const data = await inviteService.acceptInvite(userId, payload.inviteId);
        return {
          success: true,
          error: false,
          message: "Invite accepted. You joined the team.",
          data,
        };
      }

      case "REJECT_INVITE": {
        await inviteService.rejectInvite(userId, payload.inviteId);
        return {
          success: true,
          error: false,
          message: "Invite rejected.",
          data: null,
        };
      }

      case "REVOKE_INVITE": {
        await inviteService.revokeInvite(userId, payload.inviteId);
        return {
          success: true,
          error: false,
          message: "Invite revoked.",
          data: null,
        };
      }

      default: {
        // exhaustive check — TS errors here if a new payload is unhandled
        const _exhaustive: never = payload;
        return unknownService();
      }
    }
  },
);
