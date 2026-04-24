import setRedis from "../lib/redis";

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

  const disciplines: string[] = Array.isArray(profile.disciplines)
    ? profile.disciplines
    : [];

  // Single pipeline — all writes in one round-trip
  const pipeline = setRedis.pipeline();

  pipeline.set(`athletes:user:${userId}`, JSON.stringify(athleteEntry), {
    ex: 60 * 60 * 24 * 7,
  });

  // Global index (kept for the full marketplace view)
  pipeline.lpush("athletes:index", userId);

  // Discipline-specific Sets — SADD is idempotent, no duplicate risk
  for (const discipline of disciplines) {
    pipeline.sadd(`athletes:discipline:${discipline}`, userId);
  }

  await pipeline.exec();
};

export const updateAthleteInPool = async (
  userId: string,
  patch: Partial<{ inTeam: boolean; profileImage: string }>,
): Promise<void> => {
  const key = `athletes:user:${userId}`;
  const cached = await setRedis.get(key);
  if (!cached) return;

  const entry = typeof cached === "string" ? JSON.parse(cached) : cached;
  const updated = { ...entry, ...patch };

  const ttl = await setRedis.ttl(key);
  await setRedis.set(key, JSON.stringify(updated), {
    ex: ttl > 0 ? ttl : 60 * 60 * 24 * 7,
  });
};
