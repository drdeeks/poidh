# 🚀 Getting Started

**Start the bot in 5 minutes**

---

## 1️⃣ Clone & Install

```bash
git clone https://github.com/drdeeks/poidh.git
cd Poidh-autonomous
npm install
```

---

## 2️⃣ Create Wallet

```bash
npm run wallet:create
```

**Save the address and private key shown** - you'll need them next.

---

## 3️⃣ Configure Bot

```bash
cp .env.example .env
```

Edit `.env` and add these **3 required** variables:

```bash
# Your bot's private key from step 2
BOT_PRIVATE_KEY=0x...

# OpenAI API key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Keep as default (Base Mainnet):
RPC_URL=https://mainnet.base.org
```

**Full config guide:** [setup/CONFIGURATION.md](./setup/CONFIGURATION.md)

---

## 4️⃣ Fund Wallet

Send **0.01+ ETH** to the wallet address from Step 2:
- Network: **Base Mainnet**
- Check balance: `npm run wallet:balance`

---

## 5️⃣ Start Bot

```bash
npm run bounty:continuous
```

**Done!** Bot is now running 24/7 creating bounties.

---

## ✅ Verify It Works

In another terminal:
```bash
npm run server:stream
```
Open: http://localhost:3001 to see the dashboard

---

## 📚 What's Next?

- **Full technical reference** → [TECHNICAL.md](./TECHNICAL.md)
- **View proof of autonomous operation** → `cat logs/audit-trail.txt`

---

**Questions?** See [TECHNICAL.md#troubleshooting](./TECHNICAL.md#troubleshooting)
