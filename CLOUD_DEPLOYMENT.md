# Cloud Deployment Guide

Run your autonomous bounty bot on a cloud server and monitor it live on a website.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Cloud Server (AWS, DigitalOcean, Heroku, Railway, etc)         │
│                                                                 │
│  ┌──────────────────────┐        ┌──────────────────────┐      │
│  │ Continuous Bounty    │        │ Streaming Server     │      │
│  │ Loop (npm run        │───────▶│ (Express + WebSocket)│      │
│  │ bounty:continuous)   │  Audit │ Port 3001            │      │
│  │                      │  Trail │                      │      │
│  └──────────────────────┘        └──────────────────────┘      │
│         Bot Logic                  Real-time Updates            │
│                                          │                      │
└──────────────────────────────────────────┼──────────────────────┘
                                           │
                                    WebSocket + SSE
                                           │
                                           ▼
                      ┌──────────────────────────────┐
                      │  Web Browser                 │
                      │  Dashboard (index.html)      │
                      │  Live Bot Activity Monitor   │
                      └──────────────────────────────┘
```

## Quick Start with PM2

The simplest way to run both services on a cloud server.

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Create PM2 Configuration

Create `ecosystem.config.js` in your project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'bounty-bot',
      script: 'dist/scripts/continuous-bounty-loop.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      error_file: './logs/bot.log',
      out_file: './logs/bot.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'streaming-server',
      script: 'dist/server/streaming-server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        STREAMING_PORT: 3001,
        POLL_INTERVAL: 5,
      },
      error_file: './logs/server.log',
      out_file: './logs/server.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
```

### 3. Start Services with PM2

```bash
# Build TypeScript
npm run build

# Start both services
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Monitor
pm2 monit

# Stop all
pm2 stop all

# Restart all
pm2 restart all
```

### 4. Make PM2 Start on Boot

```bash
pm2 startup
pm2 save
```

## Docker Deployment

For containerized cloud deployment (AWS ECS, Digital Ocean App Platform, etc).

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy files
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY web ./web

# Install dependencies
RUN npm ci --only=production && npm run build

# Expose ports
EXPOSE 3001

# Create logs directory
RUN mkdir -p logs

# Set environment defaults
ENV NODE_ENV=production
ENV STREAMING_PORT=3001
ENV LOG_LEVEL=info

# Start both services
CMD npm run build && (npm run bounty:continuous &) && npm run server:stream
```

### 2. Create Docker Compose (for local testing)

```yaml
version: '3.8'

services:
  bounty-bot:
    build: .
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      BOT_PRIVATE_KEY: ${BOT_PRIVATE_KEY}
      RPC_URL: ${RPC_URL}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      POIDH_CONTRACT_ADDRESS: ${POIDH_CONTRACT_ADDRESS}
      CHAIN_ID: ${CHAIN_ID}
      STREAMING_PORT: 3001
      LOG_LEVEL: info
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
```

### 3. Build and Run

```bash
# Build image
docker build -t bounty-bot .

# Run container
docker run -d \
  -p 3001:3001 \
  -e BOT_PRIVATE_KEY=0x... \
  -e RPC_URL=https://mainnet.base.org \
  -e OPENAI_API_KEY=sk-... \
  -v $(pwd)/logs:/app/logs \
  --name bounty-bot \
  bounty-bot

# View logs
docker logs -f bounty-bot

# Stop container
docker stop bounty-bot
```

## Cloud Provider Setup

### AWS EC2

1. **Launch Instance**
   - Choose Ubuntu 22.04 LTS
   - t3.medium or larger
   - Allocate 30GB EBS storage

2. **Security Group**
   - Inbound: Port 3001 (HTTP) - 0.0.0.0/0
   - Inbound: Port 22 (SSH) - Your IP only

3. **SSH and Install**
   ```bash
   ssh ubuntu@your-instance-ip
   
   sudo apt update
   sudo apt install -y nodejs npm git curl
   npm install -g pm2
   
   git clone https://github.com/drdeeks/poidh.git
   cd poidh
   npm install
   npm run build
   ```

4. **Configure .env**
   ```bash
   cp .env.example .env
   nano .env  # Add your credentials
   ```

5. **Start Services**
   ```bash
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

6. **Access Dashboard**
   - Open: `http://your-instance-ip:3001`

### DigitalOcean App Platform

1. **Create New App**
   - Connect GitHub repo
   - Choose Node runtime
   - Set environment variables

2. **Configure Build Command**
   ```bash
   npm install && npm run build
   ```

3. **Configure Start Command**
   ```bash
   npm run build && (npm run bounty:continuous &) && npm run server:stream
   ```

4. **Set Environment Variables**
   ```
   BOT_PRIVATE_KEY=0x...
   RPC_URL=https://mainnet.base.org
   OPENAI_API_KEY=sk-...
   POIDH_CONTRACT_ADDRESS=0x5555...
   CHAIN_ID=8453
   STREAMING_PORT=3001
   LOG_LEVEL=info
   NODE_ENV=production
   ```

5. **Deploy**
   - Platform will auto-deploy and assign URL
   - Access dashboard at your app URL

### Railway.app

1. **Connect Repository**
   - Login to Railway
   - New Project → GitHub
   - Select your repo

2. **Add Variables**
   ```
   NODE_ENV=production
   BOT_PRIVATE_KEY=0x...
   RPC_URL=https://mainnet.base.org
   OPENAI_API_KEY=sk-...
   POIDH_CONTRACT_ADDRESS=0x5555...
   CHAIN_ID=8453
   ```

3. **Add package.json Script**
   ```json
   "start": "npm run build && (npm run bounty:continuous &) && npm run server:stream"
   ```

4. **Deploy**
   - Railway auto-detects Node.js
   - Deploys on push to main

### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create bounty-bot-$(date +%s)

# Set environment variables
heroku config:set BOT_PRIVATE_KEY=0x...
heroku config:set RPC_URL=https://mainnet.base.org
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set POIDH_CONTRACT_ADDRESS=0x5555...
heroku config:set CHAIN_ID=8453

# Create Procfile
echo "web: npm run build && (npm run bounty:continuous &) && npm run server:stream" > Procfile

# Deploy
git push heroku main

# View logs
heroku logs -t
```

## Nginx Reverse Proxy

If hosting on your own server, use Nginx to proxy to the app:

```nginx
upstream bot_server {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name bounty-bot.yourdomain.com;

    # Redirect to HTTPS (optional)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bounty-bot.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # WebSocket configuration
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;

    location / {
        proxy_pass http://bot_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring & Logging

### View Real-time Logs

```bash
# PM2
pm2 logs

# Docker
docker logs -f bounty-bot

# Heroku
heroku logs -t
```

### Monitor CPU/Memory

```bash
# PM2
pm2 monit

# System
htop
```

### Access Dashboard

Once deployed, visit:
```
https://your-domain.com:3001
```

Or
```
http://your-cloud-server-ip:3001
```

## Troubleshooting

### Bot not starting
```bash
npm run build
npm run bounty:continuous
```

### Server not accessible
- Check security groups/firewall
- Verify STREAMING_PORT is set to 3001
- Check logs: `pm2 logs` or `docker logs`

### WebSocket connection failing
- Browser console (F12) shows connection errors
- Check that server is running on correct port
- Verify firewall allows port 3001
- Check browser URL matches server URL

### Memory leaks
- Monitor with `pm2 monit`
- Set max restarts: `max_restarts: 10`
- Container memory limits: `--memory 512m`

### Dashboard not updating
- Check WebSocket connection in browser console
- Verify streaming server is running
- Check for JavaScript errors (F12)
- Try hard refresh: Ctrl+Shift+R

## Production Best Practices

1. **Use HTTPS/WSS**
   - Self-signed cert or Let's Encrypt
   - Nginx reverse proxy with SSL

2. **Environment Variables**
   - Never commit `.env` file
   - Use cloud provider secrets management
   - Rotate API keys regularly

3. **Monitoring**
   - Set up uptime monitoring (UptimeRobot, etc)
   - Monitor logs for errors
   - Alert on critical events

4. **Backups**
   - Backup audit trail logs
   - Store in cloud storage (S3, etc)
   - Daily backups recommended

5. **Security**
   - Limit bot wallet funding
   - Use read-only RPC if available
   - Monitor transaction history
   - Disable direct server access if possible

## Example: Complete DigitalOcean Setup

```bash
# 1. Create droplet (Ubuntu 22.04, $4/month)
# 2. SSH in
ssh root@your-droplet-ip

# 3. Install dependencies
apt update
apt install -y nodejs npm git curl
npm install -g pm2

# 4. Clone repo
git clone https://github.com/drdeeks/poidh.git
cd poidh

# 5. Setup
npm install
npm run build
cp .env.example .env

# 6. Edit .env with your credentials
nano .env

# 7. Configure firewall
ufw allow 22/tcp
ufw allow 3001/tcp
ufw enable

# 8. Start services
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 9. Access at: http://your-droplet-ip:3001
```

---

Now your bot runs 24/7 in the cloud with a live dashboard! 🚀
