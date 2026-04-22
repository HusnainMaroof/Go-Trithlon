import setRedis from "../lib/redis";

// services/athletePool.ts
export const addAthleteToPool = async (
  userId: string,
  profile: any,
  user: any,
): Promise<void> => {
  const athleteEntry = {
    userToken: user.userToken,
    email: user.email,
    name: user.name,
    inTeam: user.inTeam ?? false,
    isOnboard: true,
    profileImage: user.profileImage ?? null,
    athleteData: profile,
  };

  // Write individual entry — long TTL
  await setRedis.set(
    `athletes:user:${userId}`,
    JSON.stringify(athleteEntry),
    { ex: 60 * 60 * 24 * 7 },
  );

  // Append to index — store as a Redis list
  await setRedis.lpush("athletes:index", userId);
};


export const updateAthleteInPool = async (
  userId: string,
  patch: Partial<{ inTeam: boolean; profileImage: string }>,
): Promise<void> => {
  const key = `athletes:user:${userId}`;
  const cached = await setRedis.get(key);
  if (!cached) return; // not in pool yet, skip

  const entry = typeof cached === "string" ? JSON.parse(cached) : cached;
  const updated = { ...entry, ...patch };

  const ttl = await setRedis.ttl(key);
  if (ttl > 0) {
    await setRedis.set(key, JSON.stringify(updated), { ex: ttl });
  } else {
    await setRedis.set(key, JSON.stringify(updated), { ex: 60 * 60 * 24 * 7 });
  }
};