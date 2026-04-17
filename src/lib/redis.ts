import { Redis } from "@upstash/redis";
import { envConfig } from "../config/envConfig";

declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined;
}

const url = envConfig.UPSTASH_REDIS_CONFIG.UPSTASH_REDIS_REST_URL;
const token = envConfig.UPSTASH_REDIS_CONFIG.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.log("❌ Missing Upstash Redis URL or Token");
  throw new Error("Upstash Redis env missing");
}

if (!globalThis.redisClient) {
  globalThis.redisClient = new Redis({
    url,
    token,
  });
}

const setRedis = globalThis.redisClient;

// 🔥 "connection test" (real check)
(async () => {
  try {
    const test = await setRedis.ping?.();

    console.log("✅ Upstash Redis connected successfully");
    console.log("Ping response:", test || "OK");
  } catch (err) {
    console.log("❌ Upstash Redis connection failed");
    console.error(err);
  }
})();

export default setRedis;
