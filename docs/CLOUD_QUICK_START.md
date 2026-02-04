# Cloud Deployment - Quick Start

Get your autonomous bounty bot running on a cloud server in minutes with a live dashboard.

## Option 1: Docker (Easiest)

### Local Testing

```bash
# Clone repo
git clone https://github.com/drdeeks/poidh.git
cd poidh

# Copy env template
cp .env.example .env

# Edit .env with your credentials
nano .env
# Add:
# BOT_PRIVATE_KEY=0x...
# RPC_URL=https://mainnet.base.org
# OPENAI_API_KEY=sk-...
# POIDH_CONTRACT_ADDRESS=0x5555Fa783936C260f77385b4E153B9725feF1719
# CHAIN_ID=8453

# Build and run
docker-compose up

# Visit: http://localhost:3001
```

### Deploy to Cloud

```bash
# Push Dockerfile to your repo, then:

# DigitalOcean App Platform
# 1. Connect repo
# 2. Set environment variables
# 3. Deploy (auto-deploys Dockerfile)

# Or AWS ECR + ECS
aws ecr create-repository --repository-name bounty-bot
docker build -t bounty-bot .
docker tag bounty-bot:latest <account>.dkr.ecr.us-east-1.amazonaws.com/bounty-bot:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/bounty-bot:latest
# Then create ECS task definition + service
```

## Option 2: PM2 (Linux/Ubuntu Server)

### SSH into your server

```bash
ssh ubuntu@your-server-ip
```

### Setup

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/drdeeks/poidh.git
cd poidh
npm install

# Configure environment
cp .env.example .env
nano .env  # Add your credentials

# Build
npm run build
```

### Start Services

```bash
# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Make PM2 start on boot
pm2 startup
pm2 save

# Stop/restart
pm2 restart all
pm2 stop all
```

### Access Dashboard

```
http://your-server-ip:3001
```

## Option 3: Heroku (0 Setup)

### Using Heroku CLI

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create my-bounty-bot

# Set environment variables
heroku config:set BOT_PRIVATE_KEY=0x...
heroku config:set RPC_URL=https://mainnet.base.org
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set POIDH_CONTRACT_ADDRESS=0x5555Fa783936C260f77385b4E153B9725feF1719
heroku config:set CHAIN_ID=8453

# Deploy
git push heroku main

# View logs
heroku logs -t

# Access dashboard
heroku open
# Or: https://my-bounty-bot.herokuapp.com/
```

## Option 4: Railway.app

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your fork of the repo
5. Add environment variables in UI:
   - `BOT_PRIVATE_KEY=0x...`
   - `RPC_URL=https://mainnet.base.org`
   - `OPENAI_API_KEY=sk-...`
   - `POIDH_CONTRACT_ADDRESS=0x5555Fa783936C260f77385b4E153B9725feF1719`
   - `CHAIN_ID=8453`
6. Click "Deploy"
7. Visit the generated URL to see dashboard

## Option 5: DigitalOcean Droplet (Most Popular)

### Create Droplet

```bash
# 1. Login to digitalocean.com
# 2. Create -> Droplets
# 3. Choose:
#    - Ubuntu 22.04 LTS
#    - Basic (shared CPU): $4/month
#    - New SSH key
# 4. Create

# 5. SSH in
ssh root@your-droplet-ip
```

### Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Clone repo
git clone https://github.com/drdeeks/poidh.git
cd poidh

# Install and build
npm install
npm run build

# Configure
cp .env.example .env
# Edit .env with your credentials
nano .env

# Start
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Setup firewall
ufw allow 22/tcp
ufw allow 3001/tcp
ufw enable

# Optional: Setup domain with Nginx
sudo apt install nginx
# Then configure reverse proxy
```

### Access Dashboard

Visit: `http://your-droplet-ip:3001`

## Dashboard Features

```
╔═══════════════════════════════════════════╗
║ Live Bot Activity Monitor                 ║
║                                           ║
║ 📊 Statistics                             ║
║  • Bounties Created                       ║
║  • Submissions Received                   ║
║  • Total Payouts                          ║
║  • ETH Spent                              ║
║                                           ║
║ ⚡ Activity Feed                          ║
║  • BOUNTY_CREATED                         ║
║  • SUBMISSION_RECEIVED                    ║
║  • WINNER_SELECTED                        ║
║  • PAYOUT_CONFIRMED                       ║
║                                           ║
║ 🏆 Recent Winners                         ║
║  • Winner address                         ║
║  • Selection mode (First Valid/AI Judged) ║
║  • Validation checks passed               ║
║  • Timestamp                              ║
╚═══════════════════════════════════════════╝
```

## Monitoring

### View Logs

**PM2:**
```bash
pm2 logs
pm2 logs bounty-bot
pm2 logs streaming-server
```

**Docker:**
```bash
docker logs bounty-bot
docker logs -f bounty-bot  # Follow
```

**Heroku:**
```bash
heroku logs -t
```

### Monitor Performance

**PM2:**
```bash
pm2 monit
```

**Docker:**
```bash
docker stats
```

## Troubleshooting

### Bot Not Starting
```bash
npm run build
npm run bounty:continuous  # Test locally
```

### Dashboard Not Loading
- Check server is running: `pm2 status` or `docker ps`
- Verify port 3001 is open in firewall
- Check browser console (F12) for WebSocket errors

### WebSocket Timeout
- Check logs: `pm2 logs` or `docker logs`
- Verify firewall allows port 3001
- Try hard refresh: Ctrl+Shift+R

### Out of Memory
- Check memory usage: `pm2 monit`
- Increase server size
- Check for memory leaks in logs

## Stop/Update

### Stop Bot

**PM2:**
```bash
pm2 stop all
```

**Docker:**
```bash
docker-compose down
```

**Heroku:**
```bash
heroku ps:scale web=0
```

### Restart Bot

**PM2:**
```bash
pm2 restart all
```

**Docker:**
```bash
docker-compose up
```

**Heroku:**
```bash
heroku restart
```

## Security Tips

1. **Never commit .env file**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Rotate API keys regularly**
   - OpenAI API key every month
   - Bot private key if compromised

3. **Monitor wallet**
   - Only fund with what you'll use
   - Check balance regularly

4. **Use HTTPS**
   - Heroku auto-HTTPS
   - DigitalOcean + Let's Encrypt
   - Cloudflare proxy

## Cost Estimates

| Provider | Tier | Cost | Performance |
|----------|------|------|-------------|
| Heroku | Standard | $7/mo | Fair |
| DigitalOcean | $4 Droplet | $4/mo | Good |
| Railway | Starter | Free trial | Fair |
| AWS EC2 | t3.micro | $10/mo | Excellent |

## Next Steps

1. **Deploy**: Choose an option above
2. **Monitor**: Watch the dashboard
3. **Verify**: Check your wallet transactions
4. **Scale**: Run multiple bounty types
5. **Optimize**: Adjust timeouts and rewards

See [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) for detailed setup guides.

---

Now your bot runs 24/7 in the cloud! 🚀
