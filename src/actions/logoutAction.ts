// actions/logoutAction.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import setRedis from "../lib/redis";
import { getCurrentUser } from "../lib/auth";
import { getAuthSession } from "../utlis/helper";

export type ActionResponse<T = any> = {
  success: boolean;
  error: boolean;
  message?: string;
  data: T | null;
};
export const logoutAction = async (): Promise<ActionResponse> => {
  try {
    // ── 1. Resolve session identity ──────────────────────────────────────────
    const getUser = await getCurrentUser();
    const sessionId = getUser?.authsuccess?.data?.sessionId;

    if (sessionId) {
      const userData = await getAuthSession({ sessionId });
      const userId = userData?.data?.userId ?? null;

      // ── 2. Build all cache keys to bust ─────────────────────────────────────
      const keysToDelete: string[] = [
        `auth_session:${sessionId}`, // sessionId here is userToken
      ];

      if (userId) {
        keysToDelete.push(
          `invites:received:pending:${userId}`,
          `invites:sent:pending:${userId}`,
          `invites:sent:declined:${userId}`,
          `invites:received:accepted:${userId}`,
          `invites:received:rejected:${userId}`,
          `myteam:${userId}`,
        );
      }

      // ── 3. Bust all keys in one pipeline round-trip ──────────────────────────
      const pipeline = setRedis.pipeline();
      for (const key of keysToDelete) {
        pipeline.del(key);
      }
      await pipeline.exec();
    }
  } catch {
    // Session may already be expired — still clear the cookie and redirect
  }

  // ── 4. Clear the auth cookie ─────────────────────────────────────────────
  const cookieStore = await cookies();
  cookieStore.delete("auth_sessionId");

  // ── 5. Redirect to home ──────────────────────────────────────────────────

  return {
    error: false,
    success: true,
    message: "logout",
    data: null,
  };
};
