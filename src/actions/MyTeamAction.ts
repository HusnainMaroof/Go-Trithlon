"use server";

import { getCurrentUser } from "../lib/auth";
import { claimSlotService, createTeamService, deleteTeamService, getTeamService, removeFromTeamService } from "../service/team.service";
import { ActionResponse, TeamActionPayload } from "../type/teamType";
import { catchErrors } from "../utlis/ErrorWrapper";
import { getAuthSession } from "../utlis/helper";


export const teamAction = catchErrors(
  async (
    _prevState: ActionResponse,
    payload: TeamActionPayload,
  ): Promise<ActionResponse> => {
    if (!payload?.service) {
      return {
        success: false,
        error: true,
        message: "No service specified.",
        data: null,
      };
    }

    const getUser = await getCurrentUser();
    const sessionId = getUser.authsuccess.data.sessionId;
    const userData = await getAuthSession({ sessionId });

    if (!userData?.data) {
      return {
        success: false,
        error: true,
        message: "No session data",
        data: null,
      };
    }

    const userId = userData.data.userId;

    switch (payload.service) {
      case "GET_TEAM":
        return getTeamService(userId);

      case "CREATE_TEAM":
        return createTeamService(userId, payload.teamName);

      case "CLAIM_SLOT":
        return claimSlotService(
          userId,
          payload.teamId,
          payload.role,
          userData?.data?.athleteData,
        );

      case "REMOVE_FROM_TEAM":
        return removeFromTeamService(userId, payload.memberId, payload.teamId);

      case "DELETE_TEAM":
        return deleteTeamService(userId, payload.teamId);

      default: {
        const _exhaustive: never = payload;
        return {
          success: false,
          error: true,
          message: "Unknown service.",
          data: null,
        };
      }
    }
  },
);