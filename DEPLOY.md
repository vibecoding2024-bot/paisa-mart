# Deploy — Paisa Mart (EC2)

Backend: Hono + Bun, served by pm2, fronted by nginx (`:80` -> `127.0.0.1:3000`).
App code lives in `backend/`. Bun is at `~/.bun/bin/bun` (NOT on PATH).

## Routine deploy
```bash
ssh -i <key>.pem ubuntu@<host>
~/paisa-mart-new/deploy.sh        # pull + install + pm2 restart + health check
```

## Manual steps (what deploy.sh does)
```bash
cd ~/paisa-mart-new && git pull origin main
cd backend && ~/.bun/bin/bun install
pm2 restart paisa-mart && pm2 save
pm2 list
```

## Verify from anywhere
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://<host>/   # 200
```

## Troubleshoot
- `pm2 logs paisa-mart --lines 50` — app errors
- Crash-loop with `bun: not found` -> pm2 must run bun by FULL path (`~/.bun/bin/bun`), not via npm
- `sudo nginx -t && sudo systemctl status nginx` — proxy health

## VimoPay payment gateway
Server-to-server. Endpoints (mounted at `/api/payment`): `auth`, `states`, `create`, `vimopay-callback`.
Crypto is AES-256-GCM with **key = secretKey, IV = saltKey** (`encryptdecryptKey` is only the auth header).
Call the gateway over **HTTPS** (http 307-redirects to https and drops the Authorization header).
Configure via env (never commit): `VIMOPAY_BASE_URL`, `VIMOPAY_SECRET_KEY`, `VIMOPAY_SALT_KEY`,
`VIMOPAY_ED_KEY`, `VIMOPAY_USER_ID`.
