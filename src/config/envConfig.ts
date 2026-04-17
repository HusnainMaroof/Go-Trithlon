type EmailConfig = {
  BREVO_SMTP_SDK_KEY?: string;
  EMAIL_FROM?: string;
};

type UpstashRedisConfig = {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

type SecretConfig = {
  SESSION_SECRET?: string;
};

type GoogleConfig = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRETS?: string;
};

type ORIGINS = {
  ORIGIN_ONE?: string;
};

type CLOUDINARY = {
  CLOUD_NAME?: string;
  API_KEY?: string;
  API_SECRET?: string;
};

export const envConfig = {
  DATABASE_URL: process.env.DATABASE_URL,

  NODE_ENV: process.env.NODE_ENV,

  EMAIL_CONFIG: {
    BREVO_SMTP_SDK_KEY: process.env.BREVO_SMTP_SDK_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  } satisfies EmailConfig,

  UPSTASH_REDIS_CONFIG: {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  } satisfies UpstashRedisConfig,

  SECRET: {
    SESSION_SECRET: process.env.SESSION_SECRET,
  } satisfies SecretConfig,

  GOOGLE_CONFIG: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRETS: process.env.GOOGLE_CLIENT_SECRETS,
  } satisfies GoogleConfig,

  ORIGINS: {
    ORIGIN_ONE: process.env.FRONTEND_ORIGIN_ONE,
  } satisfies ORIGINS,

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  } satisfies CLOUDINARY,
};
