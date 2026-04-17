"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { setProfilePayload } from "../type/dashboardtype";
import { catchErrors } from "../utlis/ErrorWrapper";

export type ActionResponse = {
  success: boolean;
  error: boolean;
  message?: any;
  data: any;
};

export const setprofileAction = catchErrors(
  async (
    prevState: ActionResponse,
    payload: setProfilePayload,
  ): Promise<ActionResponse> => {
    // Simulate an API call with a delay
    const getUser = await getCurrentUser();

    const sessionId = getUser.sessionId;

    const getCashedUser = await setRedis.get(`auth_session:${sessionId}`);
    const sessionData =
      typeof getCashedUser === "string"
        ? JSON.parse(getCashedUser)
        : getCashedUser;
    // console.log("fom setprofile action", getCashedUser);
  const createProfile = await prisma.athleteProfile.create({
  data: {
    userId: sessionData?.userid!,

    displayName: payload.displayName ?? null,
    locationCity: payload.location ?? null,

    discipline: payload.discipline as Discipline,
    experienceLevel: payload.experienceLevel as ExperienceLevel,
    competitionLevel: payload.competitionLevel as CompetitionLevel,

    trainingDaysPerWeek: payload.trainingDays ?? null,
  },
});

    return {
      success: false,
      error: false,
      message: "Profile updated successfully",
      data: { getCashedUser },
    };
  },
);
