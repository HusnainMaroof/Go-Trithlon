import setRedis from "../lib/redis";

type AuthSessionRes = {
  data: any;
};

type Args = {
  sessionId: any;
};

export const getAuthSession = async ({
  sessionId,
}: Args): Promise<AuthSessionRes | null> => {
  const cachedKey = `auth_session:${sessionId}`;

  const cachedUser = await setRedis.get(cachedKey);

  if (!cachedUser) return null;

  let sessionData: AuthSessionRes;

  try {
    sessionData =
      typeof cachedUser === "string" ? JSON.parse(cachedUser) : cachedUser;
  } catch (err) {
    console.error("Invalid session JSON in Redis:", err);
    return null;
  }

  return { data: sessionData };
};
