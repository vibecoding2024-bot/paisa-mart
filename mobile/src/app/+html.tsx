import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#FF8C00" />
        <meta name="description" content="Join 40 Lakh+ partners earning real money by selling financial products online. Zero investment, instant payouts." />
        <title>Paisa Mart – Earn by Selling Financial Products</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webStyles }} />
      </head>
      <body>
        <div id="web-brand-header">
          <div id="web-brand-inner">
            <div id="web-logo-row">
              <div id="web-logo-dot" />
              <span id="web-logo-text">Paisa Mart</span>
            </div>
            <p id="web-tagline">India's #1 Financial Products Partner Platform</p>
            <div id="web-stats-row">
              <div className="web-stat">
                <span className="web-stat-value">40L+</span>
                <span className="web-stat-label">Partners</span>
              </div>
              <div className="web-stat-divider" />
              <div className="web-stat">
                <span className="web-stat-value">₹100Cr+</span>
                <span className="web-stat-label">Earned</span>
              </div>
              <div className="web-stat-divider" />
              <div className="web-stat">
                <span className="web-stat-value">4.5★</span>
                <span className="web-stat-label">Rating</span>
              </div>
            </div>
          </div>
        </div>

        {children}

        <div id="web-brand-footer">
          <p>Best experienced on the mobile app</p>
          <div id="web-store-badges">
            <div className="web-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </div>
            <div className="web-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.76c.3.17.64.22.98.15l13.18-7.61-2.9-2.9-11.26 10.36zm-1.7-20.1C1.2 4.04 1 4.57 1 5.14v13.72c0 .57.2 1.1.48 1.48l.08.07 7.69-7.69v-.18L1.56 3.6l-.08.06zm18.24 9.29l-2.59-1.5-3.21 3.22 3.21 3.21 2.6-1.5c.74-.43.74-1.43-.01-1.86v-.57zm-18.4 7.82l11.27-6.5-2.9-2.9-8.37 9.4z"/></svg>
              Google Play
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

const webStyles = `
/* ── Smooth rendering ── */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  -webkit-tap-highlight-color: transparent;
}

/* ── Thin orange scrollbar ── */
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,140,0,0.5); border-radius: 3px; }
* { scrollbar-width: thin; scrollbar-color: rgba(255,140,0,0.4) transparent; }

/* ── Smooth press feedback ── */
button, [role="button"], a {
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.12s ease;
}
button:active, [role="button"]:active {
  transform: scale(0.96);
  opacity: 0.85;
}

/* ── Mobile: full-screen native feel ── */
html, body {
  height: 100%;
  margin: 0; padding: 0;
  background: #fff;
}
@media (prefers-color-scheme: dark) {
  html, body { background: #000; }
}
#web-brand-header, #web-brand-footer { display: none; }

/* ══════════════════════════════════════════
   DESKTOP ≥ 768px  –  Phone-in-frame layout
══════════════════════════════════════════ */
@media (min-width: 768px) {
  html {
    height: 100%;
    background: linear-gradient(145deg, #0d0d1a 0%, #1a0a2e 35%, #0d1f3c 70%, #0d1a0d 100%);
  }

  body {
    height: auto !important;
    min-height: 100vh;
    overflow: auto !important;
    background: transparent !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 36px 20px 48px;
    gap: 0;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    position: relative;
  }

  /* Ambient glow top-right */
  body::before {
    content: '';
    position: fixed; top: -10%; right: -10%;
    width: 55vw; height: 55vh;
    background: radial-gradient(ellipse, rgba(255,140,0,0.13) 0%, transparent 65%);
    pointer-events: none; z-index: 0;
    animation: orb1 12s ease-in-out infinite;
  }
  /* Ambient glow bottom-left */
  body::after {
    content: '';
    position: fixed; bottom: -10%; left: -10%;
    width: 45vw; height: 45vh;
    background: radial-gradient(ellipse, rgba(255,200,50,0.09) 0%, transparent 65%);
    pointer-events: none; z-index: 0;
    animation: orb2 15s ease-in-out infinite;
  }
  @keyframes orb1 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(-2%,3%) scale(1.08); }
  }
  @keyframes orb2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(2%,-3%) scale(1.06); }
  }

  /* ── Brand header ── */
  #web-brand-header {
    display: block;
    z-index: 2;
    animation: fadeSlideDown 0.65s cubic-bezier(0.16,1,0.3,1) both;
    margin-bottom: 24px;
  }
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  #web-brand-inner {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  #web-logo-row {
    display: flex; align-items: center; gap: 10px;
  }
  #web-logo-dot {
    width: 28px; height: 28px; border-radius: 8px;
    background: linear-gradient(135deg, #FF8C00, #FFB800);
    box-shadow: 0 4px 16px rgba(255,140,0,0.5);
  }
  #web-logo-text {
    font-size: 22px; font-weight: 800; letter-spacing: -0.3px;
    background: linear-gradient(90deg, #FF8C00, #FFD700);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  #web-tagline {
    margin: 0; color: rgba(255,255,255,0.55);
    font-size: 13px; font-weight: 500; letter-spacing: 0.2px;
  }
  #web-stats-row {
    display: flex; align-items: center; gap: 16px; margin-top: 4px;
  }
  .web-stat {
    display: flex; flex-direction: column; align-items: center; gap: 1px;
  }
  .web-stat-value {
    color: #fff; font-size: 15px; font-weight: 700; line-height: 1.2;
  }
  .web-stat-label {
    color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .web-stat-divider {
    width: 1px; height: 28px; background: rgba(255,255,255,0.12);
  }

  /* ── #root = phone frame ── */
  #root {
    width: 393px !important;
    height: 852px !important;
    min-height: 852px !important;
    max-height: 852px !important;
    border-radius: 50px !important;
    overflow: hidden !important;
    flex: none !important;
    position: relative !important;
    z-index: 2;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.14),
      0 0 0 10px #1c1c1e,
      0 0 0 11px rgba(255,255,255,0.07),
      0 0 0 12px #141414,
      0 70px 140px rgba(0,0,0,0.85),
      0 30px 80px rgba(255,140,0,0.12);
    animation: phoneIn 0.75s cubic-bezier(0.16,1,0.3,1) 0.1s both;
  }
  /* Subtle screen glare */
  #root::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%);
    pointer-events: none; z-index: 9999; border-radius: 50px 50px 0 0;
  }
  @keyframes phoneIn {
    from { opacity: 0; transform: translateY(40px) scale(0.94); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }

  /* ── Brand footer ── */
  #web-brand-footer {
    display: block; z-index: 2; margin-top: 28px;
    text-align: center;
    animation: fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.3s both;
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  #web-brand-footer > p {
    margin: 0 0 12px; color: rgba(255,255,255,0.35);
    font-size: 12px; font-weight: 500; letter-spacing: 0.3px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  #web-store-badges {
    display: flex; gap: 10px; justify-content: center;
  }
  .web-badge {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 10px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    color: white; font-size: 12px; font-weight: 600;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    cursor: pointer; transition: background 0.2s ease, transform 0.15s ease;
    backdrop-filter: blur(10px);
  }
  .web-badge:hover {
    background: rgba(255,255,255,0.12);
    transform: translateY(-1px);
  }
}

/* ── 1200px+: slightly larger phone ── */
@media (min-width: 1200px) {
  #root {
    width: 430px !important;
    height: 932px !important;
    min-height: 932px !important;
    max-height: 932px !important;
  }
}
`;
