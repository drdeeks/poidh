# Security Guide

Comprehensive security practices for running the Autonomous Bounty Bot.

## Critical Security Rules

### 1. NEVER Commit Sensitive Files

**These MUST stay out of git:**
- `.env` (actual environment file with real credentials)
- Private keys
- API keys
- Credentials files
- Wallet JSON files

**Safe files to commit:**
- `.env.example` (template only, no real values)
- `.gitignore` (security configuration)
- Source code
- Configuration templates

### 2. Private Key Management

**Generation:**
```bash
npm run wallet:create
```
This generates a new private key. Handle with extreme care.

**Storage:**
```
✓ DO:
  - Store in .env (not committed to git)
  - Use cloud provider secrets management (AWS Secrets Manager, GitHub Secrets, etc)
  - Use environment variables
  - Keep encrypted backups offline
  - Use hardware wallet for large amounts

✗ DON'T:
  - Commit to git
  - Share via email, Slack, Discord
  - Store in plain text files
  - Use the same key for multiple environments
  - Paste into logs or error messages
```

**Key Rotation:**
```bash
# Generate new key
npm run wallet:create

# Update .env with new key
nano .env

# Withdraw any ETH from old wallet
npm run wallet:balance  # Old wallet address

# Test with new key before deploying
npm run demo:simulate
```

### 3. API Key Security

**OpenAI API Key:**
```
✓ DO:
  - Generate from: https://platform.openai.com/api-keys
  - Store in .env only
  - Rotate monthly
  - Use organization-level keys with spending limits

✗ DON'T:
  - Commit to git
  - Use in logs
  - Share with team members
  - Use expired keys
```

**RPC Endpoint:**
```
✓ DO:
  - Use authenticated RPC from:
    - Alchemy (free tier: https://alchemy.com)
    - QuickNode (free tier available)
    - Infura (free tier available)
  - Set rate limits
  - Monitor usage

✗ DON'T:
  - Expose RPC URL publicly
  - Use shared/free RPC for production (less reliable)
  - Commit custom RPC URLs with API keys
```

### 4. Wallet Funding Best Practices

**Amount:**
```
Recommended: Fund with only what you need for bounties + gas

Example budget per month:
  - Bounty rewards: $100
  - Gas fees (estimate): $50
  - Buffer: $50
  Total: ~$200 equivalent ETH

Start small and increase gradually
```

**Monitoring:**
```bash
# Check balance
npm run wallet:balance

# Set alerts for transactions
# Most wallets/explorers allow email alerts
# https://basescan.org (Base Mainnet explorer)

# Monitor transactions regularly
watch npm run wallet:balance  # Every 5 seconds
```

**Withdrawal:**
```bash
# If you need to withdraw remaining ETH:
# Send transaction from bot's wallet to your main wallet
# Use ethers.js or your wallet provider's interface
```

### 5. Environment Setup

**Local Development:**
```bash
# Copy template
cp .env.example .env

# Edit with actual values
nano .env
# BOT_PRIVATE_KEY=0x...
# RPC_URL=https://...
# OPENAI_API_KEY=sk-...

# Verify .env is in .gitignore
grep "^\.env$" .gitignore  # Should show match

# Run safely with demo mode
DEMO_MODE=true npm run bounty:continuous
```

**Cloud Deployment:**
```
✓ Use cloud provider secrets:
  - AWS: Systems Manager > Parameter Store or Secrets Manager
  - Google Cloud: Secret Manager
  - Azure: Key Vault
  - GitHub: Settings > Secrets > Actions
  - Heroku: Config Vars
  - DigitalOcean: App Platform > Environment Variables

✗ Never:
  - Pass secrets via Docker build args
  - Store in docker-compose.yml
  - Write in deployment scripts
  - Log environment variables
```

## File Security Checklist

### .gitignore Protection

Your `.gitignore` file protects:

```
Environment Files:
  .env
  .env.local
  .env.production
  .env.*.local

Credential Files:
  *.key, *.pem, *.p12, *.pfx
  *secret*.json
  *credentials*.json
  *wallet*.json
  *api_key*
  *token*

Sensitive Directories:
  logs/ (contains activity data)
  data/ (runtime data)
  .aws/ (AWS credentials)
  .gcloud/ (GCP credentials)

Development Files:
  node_modules/
  .vscode/
  .idea/
  dist/ (build output)
```

### Verify Protection

```bash
# Check .env file protection
git check-ignore -v .env
# Output: .gitignore:8:.env    .env  ✓

# Check credentials file protection
touch test_secret.json
git check-ignore -v test_secret.json
# Output should show it's ignored ✓
rm test_secret.json

# Verify only .env.example is tracked
git ls-files | grep "\.env"
# Output: .env.example  ✓
```

## Deployment Security

### Pre-Deployment Checklist

```
□ .env file created and NOT committed
□ Private key securely stored
□ API key securely stored
□ Wallet funded with appropriate amount
□ DEMO_MODE tested locally
□ RPC endpoint tested (curl $RPC_URL)
□ OpenAI API tested
□ Cloud provider secrets configured
□ Firewall rules set (port 3001 only from allowed IPs)
□ HTTPS enabled (if public)
□ Logs not containing secrets
□ No hardcoded secrets in code
□ .gitignore verified
```

### Cloud Provider Security

**AWS EC2:**
```
✓ Security Group:
  - Allow port 22 (SSH) from your IP only
  - Allow port 3001 from 0.0.0.0/0 (or restrict)
  - Deny all else

✓ Store .env in:
  - AWS Systems Manager Parameter Store
  - AWS Secrets Manager
  - Fetch at runtime

✓ Use IAM roles instead of access keys
```

**DigitalOcean:**
```
✓ Firewall:
  - Port 22 (SSH) from your IP only
  - Port 3001 to 0.0.0.0/0 (or restrict)

✓ Store secrets using:
  - App Platform Environment Variables
  - Spaces (object storage) with access keys

✓ Monitor with:
  - DigitalOcean monitoring
  - Uptime checks
```

**Heroku:**
```
✓ Config Vars:
  heroku config:set BOT_PRIVATE_KEY=0x...

✓ Automatic:
  - HTTPS enabled
  - Secrets not in logs
  - Review logs: heroku logs -t

✓ Prevent:
  - Never use --disable-auth
```

### HTTPS/WSS Configuration

For production with public access:

**Using Let's Encrypt (free):**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d bounty-bot.yourdomain.com

# Configure Nginx with SSL
# See CLOUD_DEPLOYMENT.md for example
```

**Using Cloudflare (free SSL):**
```
1. Point domain to Cloudflare nameservers
2. Cloudflare automatically provides SSL
3. No certificate management needed
4. Configure origin server IP in Cloudflare
```

## Monitoring & Audit

### Security Monitoring

```bash
# Monitor bot activity
pm2 logs bounty-bot

# Watch for errors
pm2 logs | grep -i "error"

# Monitor gas spending
pm2 logs | grep -i "payout\|gas"

# Check wallet balance
npm run wallet:balance

# Review transaction history
# https://basescan.org (search wallet address)
```

### Log Security

**What logs contain:**
- Bounty IDs and names
- Submission addresses (public)
- Transaction hashes (public)
- ETH amounts (public)
- Validation results
- Timestamps

**What logs DON'T contain:**
- Private keys ✓
- API keys ✓
- Secrets ✓
- Wallet seeds ✓

**Log storage:**
```
✓ Keep in logs/ directory (in .gitignore)
✓ Rotate logs (prevent huge files)
✓ Archive old logs
✗ Never commit logs to git
```

### Audit Trail Security

The audit trail (`logs/audit.json` and `logs/audit.txt`) contains:
- All bounty operations
- All submissions and rejections
- All payouts
- All AI evaluations

**Keep audit trail:**
```bash
# Backup regularly
cp logs/audit.json backup/audit-$(date +%Y%m%d).json

# Archive off-server
aws s3 cp logs/audit.json s3://my-bucket/audits/

# Verify integrity
git verify-pack -v .git/objects/pack/*.idx | grep -E "^\w+\s" | sort | uniq -c | sort -rn
```

## Incident Response

### If Private Key Compromised

1. **Immediately stop the bot:**
   ```bash
   pm2 stop all
   docker-compose down
   ```

2. **Generate new wallet:**
   ```bash
   npm run wallet:create
   ```

3. **Withdraw all funds from old wallet:**
   - Access wallet with old private key
   - Send all ETH to new wallet or secure address
   - Verify transaction on https://basescan.org

4. **Update environment:**
   ```bash
   nano .env  # Update BOT_PRIVATE_KEY
   npm run build
   pm2 restart all
   ```

5. **Verify security:**
   ```bash
   git log --all --grep="BOT_PRIVATE_KEY"  # Should be empty
   git log -p | grep "BOT_PRIVATE_KEY"     # Should be empty
   ```

### If API Key Compromised

1. **Revoke immediately:**
   - OpenAI: https://platform.openai.com/api-keys (delete key)
   - Generate new key

2. **Update environment:**
   ```bash
   nano .env  # Update OPENAI_API_KEY
   pm2 restart streaming-server
   ```

3. **Monitor usage:**
   - OpenAI Dashboard for suspicious activity
   - Check spending limits are enforced

### If Wallet Attacked

1. **Check transaction history:**
   ```bash
   https://basescan.org/address/YOUR_WALLET
   ```

2. **Stop bot immediately:**
   ```bash
   pm2 stop all
   ```

3. **Investigate:**
   - Check if unauthorized transactions exist
   - Review bot logs for errors
   - Check RPC endpoint security

4. **Recover:**
   - Withdraw remaining funds
   - Generate new wallet
   - Deploy with new key

## Regular Security Maintenance

### Weekly
- [ ] Check wallet balance
- [ ] Review error logs
- [ ] Verify bot is running
- [ ] Test backup/recovery procedure

### Monthly
- [ ] Rotate OpenAI API key
- [ ] Review audit trail
- [ ] Verify .gitignore is intact
- [ ] Check for suspicious transactions
- [ ] Update dependencies: `npm audit`

### Quarterly
- [ ] Full security audit
- [ ] Test incident response procedures
- [ ] Review cloud provider security settings
- [ ] Backup audit trail off-site

## Compliance

### For Production Use

**Keep records of:**
- Bounty creation dates
- Submission details
- Winner selections
- Payout transactions
- Audit trail

**For legal compliance:**
- ETH price at time of payout (taxation)
- Gas fees (deductible)
- Bounty amounts
- User identities (if required by jurisdiction)

## Resources

- OWASP Security Guidelines: https://owasp.org/
- Ethereum Security: https://ethereum.org/security
- Base Documentation: https://docs.base.org
- OpenAI API Security: https://platform.openai.com/docs/guides/safety-best-practices

## Questions?

If you discover a security vulnerability:
1. **DO NOT** post on public GitHub issues
2. **DO** email security concerns to project maintainers
3. **DO** provide detailed reproduction steps
4. **DO** allow time for response before disclosure

---

Your security is our priority. Following these guidelines ensures your bot, wallet, and credentials stay safe. 🔒
