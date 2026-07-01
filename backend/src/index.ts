import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { sampleRouter } from "./routes/sample";
import { notifyInterestRouter } from "./routes/notify-interest";
import { paymentRouter } from "./routes/payment";
import { applyCallback } from "./lib/txn-store";
import { logger } from "hono/logger";
import { authRouter } from "./routes/auth";

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

function cacheHeadersFor(path: string): HeadersInit {
  if (path.endsWith(".html")) {
    return {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    };
  }

  return {
    "Content-Type": mimeFor(path),
    "Cache-Control": "public, max-age=31536000, immutable",
  };
}

const INJECTED_HEAD = `
<meta name="theme-color" content="#FF8C00" />
<meta name="description" content="Join 40 Lakh+ partners earning real money by selling financial products online. Zero investment, instant payouts." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style id="paisa-web-polish">
/* ── Smooth rendering ── */
*{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;-webkit-tap-highlight-color:transparent}
/* ── Thin scrollbar ── */
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,140,0,0.5);border-radius:3px}*{scrollbar-width:thin;scrollbar-color:rgba(255,140,0,0.4) transparent}
/* ── Press feedback ── */
button,[role=button],a{cursor:pointer;transition:opacity .15s ease,transform .12s ease}
button:active,[role=button]:active{transform:scale(0.96);opacity:.85}
/* ── Mobile default ── */
#web-brand-header,#web-brand-footer{display:none}
html,body{height:100%;margin:0;padding:0;background:#fff}
@media(prefers-color-scheme:dark){html,body{background:#000}}

/* ══ DESKTOP ≥ 768px ══ */
@media(min-width:768px){
  html{height:100%;background:linear-gradient(145deg,#0d0d1a 0%,#1a0a2e 35%,#0d1f3c 70%,#0d1a0d 100%)}
  body{height:auto!important;min-height:100vh;overflow:auto!important;background:transparent!important;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:36px 20px 48px;gap:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;position:relative}
  body::before{content:'';position:fixed;top:-10%;right:-10%;width:55vw;height:55vh;background:radial-gradient(ellipse,rgba(255,140,0,.13) 0%,transparent 65%);pointer-events:none;z-index:0;animation:orb1 12s ease-in-out infinite}
  body::after{content:'';position:fixed;bottom:-10%;left:-10%;width:45vw;height:45vh;background:radial-gradient(ellipse,rgba(255,200,50,.09) 0%,transparent 65%);pointer-events:none;z-index:0;animation:orb2 15s ease-in-out infinite}
  @keyframes orb1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-2%,3%) scale(1.08)}}
  @keyframes orb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(2%,-3%) scale(1.06)}}
  /* Brand header */
  #web-brand-header{display:block;z-index:2;animation:fadeSlideDown .65s cubic-bezier(.16,1,.3,1) both;margin-bottom:24px;text-align:center}
  @keyframes fadeSlideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
  #web-logo-row{display:flex;align-items:center;gap:10px;justify-content:center}
  #web-logo-dot{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#FF8C00,#FFB800);box-shadow:0 4px 16px rgba(255,140,0,.5)}
  #web-logo-text{font-size:22px;font-weight:800;letter-spacing:-.3px;background:linear-gradient(90deg,#FF8C00,#FFD700);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  #web-tagline{margin:4px 0 0;color:rgba(255,255,255,.55);font-size:13px;font-weight:500}
  #web-stats-row{display:flex;align-items:center;gap:16px;margin-top:8px;justify-content:center}
  .web-stat{display:flex;flex-direction:column;align-items:center;gap:1px}
  .web-stat-value{color:#fff;font-size:15px;font-weight:700;line-height:1.2}
  .web-stat-label{color:rgba(255,255,255,.4);font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}
  .web-stat-div{width:1px;height:28px;background:rgba(255,255,255,.12)}
  /* Phone frame */
  #root{width:393px!important;height:852px!important;min-height:852px!important;max-height:852px!important;border-radius:50px!important;overflow:hidden!important;flex:none!important;position:relative!important;z-index:2;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 0 0 10px #1c1c1e,0 0 0 11px rgba(255,255,255,.07),0 0 0 12px #141414,0 70px 140px rgba(0,0,0,.85),0 30px 80px rgba(255,140,0,.12);animation:phoneIn .75s cubic-bezier(.16,1,.3,1) .1s both}
  #root::after{content:'';position:absolute;top:0;left:0;right:0;height:45%;background:linear-gradient(180deg,rgba(255,255,255,.04) 0%,transparent 100%);pointer-events:none;z-index:9999;border-radius:50px 50px 0 0}
  @keyframes phoneIn{from{opacity:0;transform:translateY(40px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}
  /* Brand footer */
  #web-brand-footer{display:block;z-index:2;margin-top:28px;text-align:center;animation:fadeSlideUp .65s cubic-bezier(.16,1,.3,1) .3s both}
  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  #web-brand-footer>p{margin:0 0 12px;color:rgba(255,255,255,.35);font-size:12px;font-weight:500;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
  #web-store-badges{display:flex;gap:10px;justify-content:center}
  .web-badge{display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:12px;font-weight:600;font-family:'Plus Jakarta Sans',system-ui,sans-serif;cursor:pointer;transition:background .2s ease,transform .15s ease;backdrop-filter:blur(10px)}
  .web-badge:hover{background:rgba(255,255,255,.14);transform:translateY(-1px)}
}
/* ── Large desktop: wider phone ── */
@media(min-width:1200px){
  #root{width:430px!important;height:932px!important;min-height:932px!important;max-height:932px!important}
}
</style>`;

const BRAND_HEADER = `
<div id="web-brand-header">
  <div id="web-logo-row">
    <div id="web-logo-dot"></div>
    <span id="web-logo-text">Paisa Mart</span>
  </div>
  <p id="web-tagline">India's #1 Financial Products Partner Platform</p>
  <div id="web-stats-row">
    <div class="web-stat"><span class="web-stat-value">40L+</span><span class="web-stat-label">Partners</span></div>
    <div class="web-stat-div"></div>
    <div class="web-stat"><span class="web-stat-value">&#8377;100Cr+</span><span class="web-stat-label">Earned</span></div>
    <div class="web-stat-div"></div>
    <div class="web-stat"><span class="web-stat-value">4.5&#9733;</span><span class="web-stat-label">Rating</span></div>
  </div>
</div>`;

const BRAND_FOOTER = `
<div id="web-brand-footer">
  <p>Best experienced on the mobile app</p>
  <div id="web-store-badges">
    <div class="web-badge">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      App Store
    </div>
    <div class="web-badge">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.76c.3.17.64.22.98.15l13.18-7.61-2.9-2.9-11.26 10.36zm-1.7-20.1C1.2 4.04 1 4.57 1 5.14v13.72c0 .57.2 1.1.48 1.48l.08.07 7.69-7.69v-.18L1.56 3.6l-.08.06zm18.24 9.29l-2.59-1.5-3.21 3.22 3.21 3.21 2.6-1.5c.74-.43.74-1.43-.01-1.86v-.57zm-18.4 7.82l11.27-6.5-2.9-2.9-8.37 9.4z"/></svg>
      Google Play
    </div>
  </div>
</div>`;

async function serveHtml(): Promise<string> {
  const raw = await Bun.file(PUBLIC_DIR + "/index.html").text();
  return raw
    .replace("</head>", INJECTED_HEAD + "\n</head>")
    .replace("<body>", "<body>\n" + BRAND_HEADER)
    .replace("</body>", BRAND_FOOTER + "\n</body>");
}

const app = new Hono();

const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/(www\.)?paisa-mart\.com$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

app.use("*", logger());

app.use("*", async (c, next) => {
  const forwardedProto = c.req.header("x-forwarded-proto");
  const host = c.req.header("host");
  if (process.env.NODE_ENV === "production" && forwardedProto === "http" && host) {
    return c.redirect(`https://${host}${new URL(c.req.url).pathname}${new URL(c.req.url).search}`, 308);
  }
  await next();
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
});

// VimoPay callback resilience: the gateway-registered callback path/host has
// varied (caused 404s), so accept the status callback on ANY path containing
// "callback", with any method, persist it, and reply with the required ack.
app.all("*", async (c, next) => {
  const pathname = new URL(c.req.url).pathname;
  if (!pathname.toLowerCase().includes("callback")) return next();
  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    try { body = Object.fromEntries(new URL(c.req.url).searchParams); } catch {}
  }
  console.log("[VIMOPAY CALLBACK]", pathname, JSON.stringify(body));
  try { applyCallback(body); } catch (e) { console.error("[VIMOPAY CALLBACK] persist failed", e); }
  return c.json({ successStatus: true, message: "Success", responseCode: "000" });
});

app.get("/health", (c) => c.json({ status: "ok" }));

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

app.route("/api/sample", sampleRouter);
app.route("/api/notify-interest", notifyInterestRouter);
app.route("/api/payment", paymentRouter);
app.route("/api/auth", authRouter);

app.get("*", async (c) => {
  const reqPath = new URL(c.req.url).pathname;
  const filePath = PUBLIC_DIR + reqPath;
  const file = Bun.file(filePath);
  if (await file.exists()) {
    return new Response(file, { headers: cacheHeadersFor(filePath) });
  }
  const html = await serveHtml();
  return new Response(html, { headers: cacheHeadersFor("index.html") });
});

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
