# Deploy — Paisa Mart (EC2)

Backend: Hono + Bun, served by pm2, fronted by nginx (`:80` -> `127.0.0.1:3000`).
App code lives in `backend/`. Bun is at `~/.bun/bin/bun` (NOT on PATH).

## One-command deploy from local machine
```bash
chmod +x scripts/deploy-ec2.sh
scripts/deploy-ec2.sh -h <ec2-host-or-ip> -k <path-to-key.pem> -u ubuntu
```

This command SSHes into EC2 and runs the existing server-side deploy script at
`~/paisa-mart-new/deploy.sh`.

## First-time EC2 setup (one time only)
```bash
# 1) SSH into instance
ssh -i <key>.pem ubuntu@<host>

# 2) Install system dependencies
sudo apt update
sudo apt install -y git curl nginx

# 3) Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 4) Install pm2
~/.bun/bin/bun add -g pm2

# 5) Clone repo
git clone <your-repo-url> ~/paisa-mart-new
cd ~/paisa-mart-new
chmod +x deploy.sh

# 6) Configure nginx reverse proxy to port 3000
sudo tee /etc/nginx/sites-available/paisa-mart >/dev/null <<'EOF'
server {
	listen 80;
	server_name paisa-mart.com www.paisa-mart.com _;

	location / {
		proxy_pass http://127.0.0.1:3000;
		proxy_http_version 1.1;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}
}
EOF

sudo ln -sf /etc/nginx/sites-available/paisa-mart /etc/nginx/sites-enabled/paisa-mart
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 7) First deploy
~/paisa-mart-new/deploy.sh
```

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
curl -I http://paisa-mart.com       # 308 to HTTPS
curl -I https://paisa-mart.com      # 200 + Strict-Transport-Security
```

## SSL (nginx + Let's Encrypt)
Point the `paisa-mart.com` and `www` DNS records at the EC2 public IP, allow inbound TCP 80/443,
then run on EC2:
```bash
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d paisa-mart.com -d www.paisa-mart.com --redirect
sudo certbot renew --dry-run
```

## Mobile OTP (MSG91)
Create an approved OTP template in MSG91, then add these to the production process environment:
```bash
MSG91_AUTH_KEY=<secret auth key>
MSG91_OTP_TEMPLATE_ID=<approved template id>
AUTH_TOKEN_SECRET=<at least 32 random bytes; e.g. openssl rand -hex 32>
NODE_ENV=production
```
Restart with updated environment (`pm2 restart paisa-mart --update-env`). For a separately hosted
mobile/web build, set `EXPO_PUBLIC_API_URL=https://paisa-mart.com` at build time.

### Separate mobile and web OTP widgets
The backend supports two OTP channels:

- `mobile`: numeric OTP flow used by the native app (`/api/auth/send-otp` then `/api/auth/verify-otp`)
- `web`: MSG91 widget-token flow used by the browser app (`/api/auth/verify-otp-token`)

Use channel-specific MSG91 values when mobile and web use different templates/widgets:
```bash
# Native app/manual OTP template
MSG91_MOBILE_AUTH_KEY=<mobile template auth key>
MSG91_MOBILE_OTP_TEMPLATE_ID=<mobile approved template id>

# Web fallback/manual OTP template, only used if the web widget env is absent
MSG91_WEB_AUTH_KEY=<web template auth key>
MSG91_WEB_OTP_TEMPLATE_ID=<web approved template id>

# Server-side widget token verification
MSG91_WEB_WIDGET_SERVER_KEY=<web widget server/auth key>
MSG91_MOBILE_WIDGET_SERVER_KEY=<mobile widget server/auth key>
```

The web build also needs the public MSG91 widget values at build time:
```bash
EXPO_PUBLIC_MSG91_WEB_WIDGET_ID=<web widget id>
EXPO_PUBLIC_MSG91_WEB_WIDGET_TOKEN_AUTH=<web widget token auth>
EXPO_PUBLIC_MSG91_MOBILE_WIDGET_ID=<mobile widget id>
EXPO_PUBLIC_MSG91_MOBILE_WIDGET_TOKEN_AUTH=<mobile widget token auth>
```

Legacy env names still work as fallback: `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`,
`MSG91_SERVER_KEY`, and `MSG91_WIDGET_TOKEN_AUTH`.

## DigiLocker KYC
The KYC screen now starts DigiLocker verification through the backend:

- `POST /api/kyc/digilocker/start`
- `GET /api/kyc/digilocker/status/:sessionId`
- `GET /api/kyc/digilocker/callback`

Configure the production process environment before enabling live KYC:
```bash
DIGILOCKER_CLIENT_ID=<partner client id>
DIGILOCKER_CLIENT_SECRET=<partner client secret>
DIGILOCKER_REDIRECT_URI=https://paisa-mart.com/api/kyc/digilocker/callback
DIGILOCKER_SCOPE=openid
DIGILOCKER_STATE_SECRET=<at least 32 random bytes; e.g. openssl rand -hex 32>
```

If API Setu/DigiLocker provides tenant-specific OAuth endpoints, set them explicitly:
```bash
DIGILOCKER_AUTH_URL=<digilocker authorize endpoint>
DIGILOCKER_TOKEN_URL=<digilocker token endpoint>
```

Restart with updated environment (`pm2 restart paisa-mart --update-env`). Without
`DIGILOCKER_CLIENT_ID` and `DIGILOCKER_CLIENT_SECRET`, the KYC start endpoint returns `503`
and the app shows a setup error instead of accepting manual document uploads.

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
