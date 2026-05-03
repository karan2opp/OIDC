# 🚀 OIDC App — VM Deployment Guide

> **VM IP:** `20.197.62.41`  
> **Domain:** `auth.yourdomain.com` ← **Replace this everywhere with your actual subdomain**  
> **Stack:** Node.js (Express) backend + React (Vite) frontend + MongoDB Atlas + Nginx + Certbot SSL  
> **OS assumed:** Ubuntu 22.04 / 24.04 LTS

---

## Table of Contents

1. [Point Your Subdomain (DNS A Record)](#1-point-your-subdomain-dns-a-record)
2. [SSH into your VM](#2-ssh-into-your-vm)
3. [Install System Dependencies](#3-install-system-dependencies)
4. [Clone the Repository](#4-clone-the-repository)
5. [Generate RSA Keys for OIDC](#5-generate-rsa-keys-for-oidc)
6. [Configure Backend Environment](#6-configure-backend-environment)
7. [Configure Frontend Environment](#7-configure-frontend-environment)
8. [Install Dependencies & Build Frontend](#8-install-dependencies--build-frontend)
9. [Run Backend with PM2](#9-run-backend-with-pm2)
10. [Serve Frontend with `serve` (or PM2)](#10-serve-frontend-with-serve-or-pm2)
11. [Configure Nginx (HTTP first)](#11-configure-nginx-http-first)
12. [Open Firewall Ports](#12-open-firewall-ports)
13. [Install SSL with Certbot](#13-install-ssl-with-certbot)
14. [Update Env Files to HTTPS & Rebuild](#14-update-env-files-to-https--rebuild)
15. [Verify Everything Works](#15-verify-everything-works)
16. [Useful PM2 Commands](#16-useful-pm2-commands)

---

## 1. Point Your Subdomain (DNS A Record)

Go to your **domain registrar / DNS provider** (GoDaddy, Cloudflare, Namecheap, Route53, etc.) and add an **A record**:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `auth` | `20.197.62.41` | 600 (or Auto) |

> This maps `auth.yourdomain.com` → `20.197.62.41`

### Verify DNS propagation

Wait 2-5 minutes, then check from your local machine:

```bash
# From your local machine (not the VM)
nslookup auth.yourdomain.com
# or
ping auth.yourdomain.com
```

You should see it resolving to `20.197.62.41`. Don't proceed until DNS is propagated.

> **💡 Tip:** If using **Cloudflare**, set the proxy status to **DNS only** (grey cloud) initially so Certbot can reach your server directly. You can enable the orange cloud later.

---

## 2. SSH into your VM

```bash
ssh your-username@20.197.62.41
```

> If you're on Azure, you may use:
> ```bash
> ssh -i ~/.ssh/your-key.pem azureuser@20.197.62.41
> ```

---

## 3. Install System Dependencies

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v    # should print v20.x.x
npm -v     # should print 10.x.x

# Install Nginx
sudo apt install -y nginx

# Install Certbot + Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 globally (process manager)
sudo npm install -g pm2

# Install 'serve' globally (to serve the React build)
sudo npm install -g serve

# Install OpenSSL (usually pre-installed)
sudo apt install -y openssl

# Install Git
sudo apt install -y git
```

---

## 4. Clone the Repository

```bash
cd /home/azureuser   # or wherever you want
git clone https://github.com/YOUR_USERNAME/my_oidc.git
cd my_oidc
```

> If your repo is private, use SSH or a personal access token:
> ```bash
> git clone https://<TOKEN>@github.com/YOUR_USERNAME/my_oidc.git
> ```

---

## 5. Generate RSA Keys for OIDC

The backend needs RSA keys inside `backend/cert/` for signing OIDC tokens.

```bash
cd /home/azureuser/my_oidc/backend

# Create cert directory
mkdir -p cert

# Generate private key (RSA 2048-bit)
openssl genpkey -algorithm RSA -out cert/private-key.pem -pkeyopt rsa_keygen_bits:2048

# Extract public key
openssl rsa -in cert/private-key.pem -pubout -out cert/public-key.pub

# Verify keys exist
ls -la cert/
# Should show: private-key.pem  public-key.pub
```

---

## 6. Configure Backend Environment

Create the `.env` file inside the `backend/` directory:

```bash
cd /home/azureuser/my_oidc/backend
nano .env
```

Paste the following (**use HTTP for now** — we'll switch to HTTPS after Certbot in Step 14):

```env
PORT=8001
MONGODB_URI=mongodb+srv://knagpal119_db_user:scoutop*001@cluster0.vnyhxyf.mongodb.net/oidc
EMAIL_API_KEY=re_b43dSJKy_EbAXKBzhzbHbBWSTXQLmZTnA
CLIENT_URL=http://auth.yourdomain.com
FRONTEND_URL=http://auth.yourdomain.com
SESSION_SECRET=hrjwgfadwueoduixahjjqajehdbanxaksj
JWT_ACCESS_SECRET=fjjhbjhasdwieowhdsgchxfght
JWT_ACCESS_EXPIRES_IN=59m
JWT_REFRESH_SECRET=ffjcnskxorovjcllsotvpppwefc
JWT_REFRESH_EXPIRES_IN=7d
ISSUER=http://auth.yourdomain.com/api/oidc
NODE_ENV=production
```

### ⚠️ Key changes from localhost:

| Variable | Local Value | Production Value |
|---|---|---|
| `CLIENT_URL` | `http://localhost:8000` | `http://auth.yourdomain.com` |
| `FRONTEND_URL` | `http://localhost:5173` | `http://auth.yourdomain.com` |
| `ISSUER` | `http://localhost:8001` | `http://auth.yourdomain.com/api/oidc` |
| `NODE_ENV` | _(not set)_ | `production` |

> **Save & exit:** Press `Ctrl + O`, `Enter`, then `Ctrl + X`

---

## 7. Configure Frontend Environment

Create the `.env.production` file inside the `frontend/` directory:

```bash
cd /home/azureuser/my_oidc/frontend
nano .env.production
```

Paste the following (**HTTP for now** — will update to HTTPS in Step 14):

```env
VITE_API_URL=http://auth.yourdomain.com/api
VITE_FRONTEND_URL=http://auth.yourdomain.com
VITE_ALLOWED_REDIRECT_DOMAINS=auth.yourdomain.com
VITE_OIDC_URL=http://auth.yourdomain.com/api/oidc
```

### ⚠️ Key changes from localhost:

| Variable | Local Value | Production Value |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8001/api` | `http://auth.yourdomain.com/api` |
| `VITE_FRONTEND_URL` | `http://localhost:5173` | `http://auth.yourdomain.com` |
| `VITE_OIDC_URL` | `http://localhost:8001` | `http://auth.yourdomain.com/api/oidc` |

> **Important:** Vite injects these at **build time**, so you must set them **before** running `npm run build`.

---

## 8. Install Dependencies & Build Frontend

### Backend

```bash
cd /home/azureuser/my_oidc/backend
npm install
```

### Frontend

```bash
cd /home/azureuser/my_oidc/frontend
npm install
npm run build
```

This creates a `frontend/dist/` folder with the production-ready static files.

Verify the build:
```bash
ls dist/
# Should show: index.html, assets/, etc.
```

---

## 9. Run Backend with PM2

```bash
cd /home/azureuser/my_oidc/backend

# Start the backend server
pm2 start server.js --name "oidc-backend"

# Verify it's running
pm2 status

# Check logs if something is wrong
pm2 logs oidc-backend

# Save the PM2 process list (survives reboot)
pm2 save

# Setup PM2 to auto-start on boot
pm2 startup
# Run the command it outputs (copy-paste it)
```

The backend will be running on `http://127.0.0.1:8001`.

---

## 10. Serve Frontend with `serve` (or PM2)

### Option A — Use `serve` via PM2 (Recommended)

```bash
cd /home/azureuser/my_oidc/frontend

# Serve the dist folder on port 3000
pm2 start serve --name "oidc-frontend" -- -s dist -l 3000

# Verify
pm2 status

# Save again
pm2 save
```

### Option B — Let Nginx serve the static files directly (Alternative)

Skip this step and configure Nginx to serve `dist/` directly (see Nginx config Option B in Step 11).

---

## 11. Configure Nginx (HTTP first)

We set up HTTP first so Certbot can verify your domain. Certbot will automatically upgrade this to HTTPS in Step 13.

```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create new config
sudo nano /etc/nginx/sites-available/oidc
```

### Option A — Frontend via `serve` on port 3000 + Backend on port 8001

```nginx
server {
    listen 80;
    server_name auth.yourdomain.com;

    # Frontend: Proxy to serve (port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend: Proxy API requests to Express (port 8001)
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option B — Nginx serves static files directly (no `serve` needed)

```nginx
server {
    listen 80;
    server_name auth.yourdomain.com;

    # Frontend: Serve React build directly
    root /home/azureuser/my_oidc/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend: Proxy API requests
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable the config and restart Nginx

```bash
# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/oidc /etc/nginx/sites-enabled/oidc

# Test Nginx config for syntax errors
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Quick test (HTTP)

```bash
curl http://auth.yourdomain.com/
# Should return the React HTML
```

---

## 12. Open Firewall Ports

### On the VM (UFW)

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (needed for Certbot verification)
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

### On Azure Portal (NSG — Network Security Group)

Go to your VM → **Networking** → **Inbound port rules** → Add rules for:

| Priority | Port | Protocol | Action | Name |
|---|---|---|---|---|
| 300 | 80 | TCP | Allow | Allow-HTTP |
| 310 | 443 | TCP | Allow | Allow-HTTPS |
| 320 | 22 | TCP | Allow | Allow-SSH |

> ⚠️ **Do NOT expose ports 3000 or 8001** to the internet. Nginx handles all external traffic on ports 80/443.

---

## 13. Install SSL with Certbot

Now that Nginx is running on HTTP and your domain points to the VM, run Certbot:

```bash
sudo certbot --nginx -d auth.yourdomain.com
```

Certbot will:
1. Ask for your email (for renewal notices)
2. Ask you to agree to Terms of Service
3. Automatically verify your domain via HTTP
4. Obtain an SSL certificate from Let's Encrypt
5. **Automatically modify your Nginx config** to add HTTPS (port 443) and redirect HTTP → HTTPS

### Verify Certbot modified Nginx correctly

```bash
sudo cat /etc/nginx/sites-available/oidc
```

You should now see `listen 443 ssl;` lines and certificate paths added automatically.

### Test auto-renewal

```bash
sudo certbot renew --dry-run
```

> Certbot sets up a cron job / systemd timer for auto-renewal. Certificates renew every 90 days automatically.

### Verify HTTPS works

```bash
curl https://auth.yourdomain.com/
# Should return the React HTML over HTTPS

curl https://auth.yourdomain.com/api/oidc/.well-known/openid-configuration
# Should return OIDC discovery JSON
```

---

## 14. Update Env Files to HTTPS & Rebuild

Now that SSL is active, update all URLs from `http://` to `https://`.

### Backend `.env`

```bash
cd /home/azureuser/my_oidc/backend
nano .env
```

Change these three lines:

```env
CLIENT_URL=https://auth.yourdomain.com
FRONTEND_URL=https://auth.yourdomain.com
ISSUER=https://auth.yourdomain.com/api/oidc
```

> Everything else stays the same. Save & exit.

### Frontend `.env.production`

```bash
cd /home/azureuser/my_oidc/frontend
nano .env.production
```

Update **all** values to HTTPS:

```env
VITE_API_URL=https://auth.yourdomain.com/api
VITE_FRONTEND_URL=https://auth.yourdomain.com
VITE_ALLOWED_REDIRECT_DOMAINS=auth.yourdomain.com
VITE_OIDC_URL=https://auth.yourdomain.com/api/oidc
```

### Rebuild Frontend & Restart Backend

```bash
# Rebuild frontend with new HTTPS env vars
cd /home/azureuser/my_oidc/frontend
npm run build

# Restart everything
pm2 restart all

# Verify
pm2 status
```

---

## 15. Verify Everything Works

### Check all services are running

```bash
# PM2 processes
pm2 status
# Should show:  oidc-backend (online)  and  oidc-frontend (online)

# Nginx
sudo systemctl status nginx
```

### Test from your browser

| URL | What it should show |
|---|---|
| `https://auth.yourdomain.com/` | React frontend (login page or app) |
| `https://auth.yourdomain.com/login` | Login page |
| `https://auth.yourdomain.com/register` | Register page |
| `https://auth.yourdomain.com/api/oidc/.well-known/openid-configuration` | OIDC discovery JSON |
| `https://auth.yourdomain.com/api/oidc/.well-known/jwks.json` | JWKS public keys JSON |

### Test from command line

```bash
# Test backend API
curl https://auth.yourdomain.com/api/oidc/.well-known/openid-configuration

# Test frontend
curl https://auth.yourdomain.com/

# Test HTTP → HTTPS redirect
curl -I http://auth.yourdomain.com/
# Should return: 301 Moved Permanently → https://auth.yourdomain.com/
```

### Check SSL certificate

```bash
# From your local machine
openssl s_client -connect auth.yourdomain.com:443 -servername auth.yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -subject -dates
```

---

## 16. Useful PM2 Commands

```bash
pm2 status               # See all processes
pm2 logs                 # See all logs (live)
pm2 logs oidc-backend    # Backend logs only
pm2 restart all          # Restart everything
pm2 restart oidc-backend # Restart backend only
pm2 stop all             # Stop everything
pm2 delete all           # Remove all processes
pm2 monit                # Real-time monitoring dashboard
```

---

## 🔥 Quick Summary — Full Command Sequence

```bash
# ─── 1. DNS ───
# Add A record:  auth  →  20.197.62.41  (in your DNS provider)
# Wait for propagation, verify with: nslookup auth.yourdomain.com

# ─── 2. SSH in ───
ssh azureuser@20.197.62.41

# ─── 3. Install deps ───
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx openssl git
sudo npm install -g pm2 serve

# ─── 4. Clone ───
cd /home/azureuser
git clone <your-repo-url> my_oidc
cd my_oidc

# ─── 5. RSA keys ───
cd backend
mkdir -p cert
openssl genpkey -algorithm RSA -out cert/private-key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in cert/private-key.pem -pubout -out cert/public-key.pub

# ─── 6. Backend env (HTTP first) ───
nano .env
# Paste env values with http://auth.yourdomain.com (see Step 6)

# ─── 7. Backend install & start ───
npm install
pm2 start server.js --name "oidc-backend"

# ─── 8. Frontend env, install, build & serve ───
cd ../frontend
nano .env.production
# Paste env values with http://auth.yourdomain.com (see Step 7)
npm install
npm run build
pm2 start serve --name "oidc-frontend" -- -s dist -l 3000

# ─── 9. PM2 persist ───
pm2 save
pm2 startup   # run the command it prints

# ─── 10. Nginx (HTTP) ───
sudo rm /etc/nginx/sites-enabled/default
sudo nano /etc/nginx/sites-available/oidc
# Paste Nginx config with server_name auth.yourdomain.com (see Step 11)
sudo ln -s /etc/nginx/sites-available/oidc /etc/nginx/sites-enabled/oidc
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# ─── 11. Firewall ───
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# ─── 12. SSL with Certbot ───
sudo certbot --nginx -d auth.yourdomain.com
sudo certbot renew --dry-run

# ─── 13. Update to HTTPS & rebuild ───
cd /home/azureuser/my_oidc/backend
nano .env
# Change CLIENT_URL, FRONTEND_URL, ISSUER to https://auth.yourdomain.com...

cd /home/azureuser/my_oidc/frontend
nano .env.production
# Change all VITE_* URLs to https://auth.yourdomain.com...
npm run build

pm2 restart all

# ─── 14. Test ───
curl https://auth.yourdomain.com/api/oidc/.well-known/openid-configuration
```

---

## ⚠️ Things to Fix in Code Before Production

1. **`email.js` hardcoded values** — The email config at `backend/src/common/config/email.js` has:
   - Hardcoded Resend API key (move to `EMAIL_API_KEY` env var)
   - Hardcoded `to: 'knagpal119@gmail.com'` (make dynamic using function parameter)
   - Hardcoded `http://localhost:8000` verification URL (use `CLIENT_URL` env var)

2. **MongoDB Atlas Whitelist** — Make sure your VM IP (`20.197.62.41`) is whitelisted in MongoDB Atlas:
   - Go to Atlas → **Network Access** → **Add IP Address** → `20.197.62.41`
   - Or use `0.0.0.0/0` to allow all (less secure)

3. **Session cookie `secure` flag** — Your app sets `secure: true` when `NODE_ENV=production`. This **requires HTTPS**, which is now handled by Certbot ✅

4. **OIDC Issuer consistency** — Make sure `ISSUER` in `.env` matches what your OIDC discovery endpoint returns. Clients validating ID tokens will check this.

5. **CORS origin** — The backend reads `FRONTEND_URL` for CORS. After switching to HTTPS, any request from `http://` will be blocked — which is correct behavior.

---

## 🔄 Redeployment (After Code Changes)

When you push new code and want to update the VM:

```bash
ssh azureuser@20.197.62.41
cd /home/azureuser/my_oidc

# Pull latest code
git pull origin main

# Backend: reinstall deps if package.json changed, then restart
cd backend
npm install
pm2 restart oidc-backend

# Frontend: reinstall, rebuild, restart
cd ../frontend
npm install
npm run build
pm2 restart oidc-frontend
```

---

**You're done! 🎉** Your OIDC app is now live at `https://auth.yourdomain.com`
