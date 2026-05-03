import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { sampleRouter } from "./routes/sample";
import { notifyInterestRouter } from "./routes/notify-interest";
import { logger } from "hono/logger";

const PUBLIC_DIR = import.meta.dir + "/../public";

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function mimeFor(path: string): string {
  const ext = path.match(/\.[^.]+$/)?.[0] ?? "";
  return MIME[ext] ?? "application/octet-stream";
}

const app = new Hono();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Project download
app.get("/download", async (c) => {
  const file = Bun.file("/home/user/workspace/backend/paisa-mart-mvp.zip");
  const exists = await file.exists();
  if (!exists) return c.text("File not found", 404);
  const buffer = await file.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="paisa-mart-mvp.zip"',
      "Access-Control-Allow-Origin": "*",
    },
  });
});

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/notify-interest", notifyInterestRouter);

// Serve static web app — must be last
app.get("*", async (c) => {
  const reqPath = new URL(c.req.url).pathname;
  const filePath = PUBLIC_DIR + reqPath;
  const file = Bun.file(filePath);
  if (await file.exists()) {
    return new Response(file, { headers: { "Content-Type": mimeFor(filePath) } });
  }
  // SPA fallback — serve index.html for all unmatched routes
  const index = Bun.file(PUBLIC_DIR + "/index.html");
  return new Response(index, { headers: { "Content-Type": "text/html" } });
});

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
