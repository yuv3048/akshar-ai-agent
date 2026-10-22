import { Hono } from "hono";
import type { AppBindings } from "../env";

const health = new Hono<AppBindings>();

health.get("/", (c) => {
  return c.json({
    ok: true,
    service: "akshar-ai-api",
    environment: c.env.APP_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default health;
