"use server";

import { cookies } from "next/headers";
import setRedis from "./redis";
import { authFalse, AuthPayload, UserType } from "../type/authTypes";

export const getCurrentUser = async (): Promise<AuthPayload> => {
  const cookieStore = await cookies();
  const auth_sessionId = cookieStore.get("auth_sessionId")?.value;

  if (!auth_sessionId) {
    console.log("No session found");

    return {
      autherror: { error: true, message: "no session" },
      authsuccess: { ...authFalse },
    };
  }

  const session = await setRedis.get(`auth_session:${auth_sessionId}`);
  // console.log(session);

  if (!session)
    return {
      autherror: { error: true, message: "Session expired or not found" },
      authsuccess: { ...authFalse },
    };

  // console.log("from auth.ts", session);
  const parsed = typeof session === "string" ? JSON.parse(session) : session;
  return {
    autherror: { error: false, message: "" },
    authsuccess: {
      success: true,
      authMessage: "auth",
      data: {
        inTeam:parsed.inTeam,
        userId: parsed.userId,
        sessionId: auth_sessionId,
        email: parsed?.email!,
        displayName: parsed?.displayName!,
        userToken: parsed?.userToken!,
        isOnboard: parsed?.isOnboard!,
        athleteData: parsed?.athleteData!,
        profileImage: parsed?.profileImage!,
      },
    },
  };
};
