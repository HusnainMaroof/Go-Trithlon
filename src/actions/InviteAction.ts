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
      case "GET_INVITES":
        return await inviteService.getInvites(userId);

      case "SEND_INVITE":
        return await inviteService.sendInvite(userId, {
          toUserId: payload.toUserId,
          role: payload.role,
        });

      case "ACCEPT_INVITE":
        return await inviteService.acceptInvite(userId, payload.inviteId);

      case "REJECT_INVITE":
        return await inviteService.rejectInvite(userId, payload.inviteId);

      case "REVOKE_INVITE":
        return await inviteService.revokeInvite(userId, payload.inviteId);

      default: {
        const _exhaustive: never = payload;
        return unknownService();
      }
    }
  },
);
