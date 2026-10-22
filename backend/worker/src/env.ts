export interface Env {
  APP_ENV: "development" | "production";
  CORS_ORIGIN: string;

  // Configure these as Worker secrets, never commit their values.
  MONGODB_URI: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;

  // R2 binding is configured in wrangler.jsonc.
  AKSHAR_FILES: R2Bucket;
}

export type AppBindings = {
  Bindings: Env;
  Variables: {
    userId: string;
  };
};
