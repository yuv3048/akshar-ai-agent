import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppBindings } from "./env";
import health from "./routes/health";

const app = new Hono<AppBindings>();

app.use(
  "*",
  cors({
    origin: (origin, c) =>
      origin === c.env.CORS_ORIGIN ? origin : "",
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (c) =>
  c.json({ name: "Akshar AI API", status: "running" }),
);

app.route("/health", health);

app.notFound((c) => c.json({ error: "Route not found" }, 404));

app.onError((error, c) => {
  console.error("Unhandled API error", error);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
