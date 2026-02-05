# Poidh Autonomous Bounty Bot

> **An enterprise-grade, fully autonomous bounty system that creates, monitors, validates, and pays out real-world proof bounties on any EVM-compatible blockchain with zero human intervention.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

---

## 🚀 Overview

The Poidh Autonomous Bounty Bot is a sophisticated, enterprise-grade system designed for complete autonomy. It is a powerful tool for creating and managing bounty programs on the blockchain, without the need for manual intervention. Once initialized, it operates without any human interaction, managing the entire lifecycle of bounties on EVM-compatible blockchains.

The goal of this project is to create a fully autonomous system that can be used to incentivize and reward real-world actions, with the goal of creating a more transparent and equitable world.

### ✨ Key Features

- **💯 100% Autonomous:** Set it up once and let it run. No further human interaction is required.
- **🌐 Multi-Chain Support:** Operates on any EVM-compatible chain, including Base, Arbitrum, Degen, and more.
- **🔐 Cryptographic Proof:** Every action is logged with cryptographic proof, ensuring a tamper-proof audit trail.
- **🤖 AI-Powered Judging:** Utilizes GPT-4 Vision for subjective evaluations in creative contests.
- **🛡️ Enterprise-Grade Security:** Built with security in mind, including private key management and gas fee optimization.
- **🖥️ Real-Time Monitoring:** A web-based dashboard provides live updates on all activities.

---

## 🏃‍♀️ Quick Start

Get up and running in just a few minutes.

### ✅ Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn
- A small amount of cryptocurrency (e.g., 0.01 ETH) to fund the bounties.
- An `OPENAI_API_KEY` (optional, only required for AI-judged bounties).

### ⚙️ 5-Minute Setup

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/drdeek/poidh-autonomous.git
    cd poidh-autonomous
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Generate a Wallet**

    ```bash
    npm run wallet:create
    ```

    *Save the private key and address. You'll need them in the next step.*

4.  **Configure Environment**

    ```bash
    cp .env.example .env
    ```

    *Edit the `.env` file to add your `BOT_PRIVATE_KEY` and, optionally, your `OPENAI_API_KEY`.*

5.  **Fund Your Wallet**

    ```bash
    npm run wallet:balance
    ```

    *Send funds to the wallet address displayed. The amount will depend on the chain you're using.*

6.  **Create a Bounty**

    ```bash
    npm run agent:handwritten -- --chain degen --reward 1
    ```

7.  **Monitor Your Bounties**

    ```bash
    npm run agent:monitor -- --chain degen
    ```

---

## 🏛️ Core Concepts

Understand the fundamental principles that make the Poidh Autonomous Bounty Bot work.

### System Flow

The bot follows a simple, four-step process:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CREATE    │ ──▶ │   MONITOR   │ ──▶ │  VALIDATE   │ ──▶ │   PAYOUT    │
│  (on-chain) │     │ (30s poll)  │     │ (8 checks)  │     │   (auto)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  TX Hash logged     Submissions         Score logged        TX Hash logged
  to audit trail     fetched             with rationale      to audit trail
```

### Project Structure

The project is organized into several key directories:

```
poidh-autonomous/
├── src/
│   ├── agent.ts                    # Main orchestration loop
│   ├── bounty/
│   │   ├── manager.ts              # Bounty lifecycle management
│   │   ├── monitor.ts              # Blockchain polling
│   │   ├── types.ts                # TypeScript interfaces
│   │   └── configs/
│   │       └── production-bounties.ts  # Pre-built templates
│   ├── evaluation/
│   │   ├── index.ts                # Evaluation coordinator
│   │   ├── validator.ts            # 8 deterministic checks
│   │   └── ai-judge.ts             # GPT-4 Vision integration
│   ├── contracts/
│   │   ├── poidh.ts                # POIDH V3 smart contract
│   │   ├── multi-chain.ts          # Multi-chain contract manager
│   │   └── abis.ts                 # Contract ABIs
│   ├── wallet/
│   │   ├── index.ts                # Wallet operations
│   │   └── multi-chain.ts          # Multi-chain wallet manager
│   ├── config/
│   │   ├── index.ts                # Environment configuration
│   │   └── chains.ts               # Chain configurations
│   ├── utils/
│   │   ├── audit-trail.ts          # Cryptographic logging
│   │   ├── logger.ts               # Structured logging
│   │   ├── uri-fetcher.ts          # IPFS/HTTP content fetching
│   │   └── health.ts               # System health monitoring
│   ├── scripts/                    # Utility scripts
│   ├── server/                     # Web dashboard
│   └── demos/                      # Example implementations
├── logs/                           # Audit trails and logs
├── data/                           # Persistent data storage
├── tests/                          # Test suites
└── PROOF_OF_AUTONOMY.md           # Autonomy verification guide
```

---

## 📚 Commands Reference

A comprehensive guide to all the available commands.

### Agent Operations

These commands are used to create and manage bounties.

| Command | Description |
| :--- | :--- |
| `npm run agent` | Starts the agent in interactive mode, allowing you to choose a chain. |
| `npm run agent:outside` | Creates a bounty for an outdoor proof. |
| `npm run agent:handwritten` | Creates a bounty for a handwritten proof of date. |
| `npm run agent:meal` | Creates a bounty for a photo of a meal. |
| `npm run agent:tower` | Creates a bounty for an object stacking contest (AI-judged). |
| `npm run agent:shadow` | Creates a bounty for a shadow art contest (AI-judged). |
| `npm run agent:animal` | Creates a bounty for a pet or wildlife photo contest (AI-judged). |
| `npm run agent:list` | Lists all available bounty templates. |
| `npm run agent:monitor` | Monitors all bounties created by the bot's wallet. |

#### Command Flags

- `--chain <chain>`: Specify the blockchain to use (e.g., `base`, `arbitrum`, `degen`).
- `--reward <amount>`: Set a custom reward amount in the chain's native currency.

### Bounty Management

These commands are used to manage the bounty lifecycle.

| Command | Description |
| :--- | :--- |
| `npm run bounty:list` | Lists all active bounties. |
| `npm run bounty:claims` | Checks for claims on active bounties. |
| `npm run bounty:cancel` | Cancels a bounty and refunds the funds. |
| `npm run bounty:continuous` | Runs the bot in a continuous loop, automatically creating new bounties. |

### Wallet Operations

These commands are used to manage the bot's wallet.

| Command | Description |
| :--- | :--- |
| `npm run wallet:create` | Generates a new wallet and displays the private key and address. |
| `npm run wallet:balance` | Checks the wallet balance. |

### Development

These commands are used for development and testing.

| Command | Description |
| :--- | :--- |
| `npm run build` | Compiles the TypeScript code. |
| `npm run dev` | Runs the bot in development mode using `ts-node`. |
| `npm run test` | Runs the test suite. |
| `npm run test:watch` | Runs the tests in watch mode. |
| `npm run lint` | Lints the code. |
| `npm run lint:fix`| Automatically fixes linting issues. |
| `npm run typecheck`| Validates the TypeScript types. |
| `npm run format` | Formats the code with Prettier. |

### Demos

These commands are used to run demonstrations of the bot's features.

| Command | Description |
| :--- | :--- |
| `npm run demo:simulate` | Runs a full simulation without any real transactions. |
| `npm run demo:first-valid`| Demonstrates the "first-valid" selection mode. |
| `npm run demo:ai-judged` | Demonstrates the AI-judged selection mode. |

### Server

This command is used to start the web dashboard.

| Command | Description |
| :--- | :--- |
| `npm run server:stream` | Starts the web dashboard. |

---

## 🔧 Configuration

The bot is configured using environment variables. You can find a complete list of options in the `.env.example` file.

### Required

- `BOT_PRIVATE_KEY`: The private key for the bot's wallet.
- `RPC_URL`: The URL of the blockchain RPC endpoint.

### Optional

- `OPENAI_API_KEY`: Your OpenAI API key (for AI-judged bounties).
- `CHAIN_ID`: The ID of the blockchain to use.
- `SUPPORTED_CHAINS`: A comma-separated list of supported chain IDs.
- `POIDH_CONTRACT_ADDRESS`: The address of the POIDH contract.
- `POLLING_INTERVAL`: The interval (in seconds) for polling the blockchain.
- `MAX_GAS_PRICE_GWEI`: The maximum gas price to use for transactions.
- `AUTO_APPROVE_GAS`: Whether to automatically approve gas fees.
- `DEMO_MODE`: Whether to run in demo mode (no real transactions).
- `LOG_LEVEL`: The logging level (e.g., `debug`, `info`, `warn`, `error`).
- `LOG_FILE`: The path to the log file.
- `OPENAI_VISION_MODEL`: The OpenAI model to use for AI-judged bounties.
- `STREAMING_PORT`: The port for the web dashboard.
- `POLL_INTERVAL`: The polling interval for the dashboard.

---

## 🌐 Multi-Chain Support

The bot is designed to be chain-agnostic and supports any EVM-compatible blockchain.

### Supported Networks

| Chain | Chain ID | Native Token |
| :--- | :--- | :--- |
| **Base Mainnet** | 8453 | ETH |
| **Base Sepolia** | 84532 | ETH |
| **Arbitrum One** | 42161 | ETH |
| **Arbitrum Sepolia**| 421614 | ETH |
| **Degen** | 666666666 | DEGEN |

### Adding a New Chain

To add a new chain, you'll need to update the `src/config/chains.ts` file with the chain's configuration.

```typescript
// src/config/chains.ts

export const chains: ChainConfig[] = [
  // ... existing chains
  {
    chainId: 12345,
    name: 'My Custom Chain',
    nativeCurrency: 'MYC',
    rpcUrls: ['https://my-custom-chain.rpc.url'],
    blockExplorerUrls: ['https://my-custom-chain.explorer.url'],
    poidhContractAddress: '0x1234567890123456789012345678901234567890',
    enabled: true,
  },
];
```

---

## ✅ Validation System

The validation system is at the core of the bot's functionality.

### The 8 Validation Checks

Each submission is evaluated against a series of deterministic checks:

1.  **Proof Content:** Verifies that the content exists.
2.  **Valid Media:** Confirms that the media is accessible.
3.  **EXIF Data:** Detects real camera metadata.
4.  **Photo Freshness:** Ensures that the photo was taken recently.
5.  **Screenshot Check:** Prevents screenshot submissions.
6.  **Location Match:** Verifies GPS coordinates (optional).
7.  **Time Window:** Validates the submission timing (optional).
8.  **Keywords:** Checks for the presence of required text (optional).

### Selection Modes

- **FIRST_VALID:** The first submission to score 50 or more points wins.
- **AI_JUDGED:** All submissions are collected until the deadline, and then GPT-4 Vision selects the winner.

---

## 🚀 Deployment

Deploy the bot using Docker, PM2, or a cloud platform of your choice.

### Docker

A `Dockerfile` and `docker-compose.yml` are included for easy deployment.

```bash
# Build and start the bot in detached mode
docker-compose up -d --build
```

### PM2

An `ecosystem.config.js` file is provided for use with PM2.

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start ecosystem.config.js
```

### Cloud Platforms

The bot can be deployed to any platform that supports Node.js, such as Railway, Heroku, or DigitalOcean.

- **Railway:** `railway login`, `railway init`, `railway up`
- **Heroku:** `heroku create`, `heroku config:set`, `git push heroku main`
- **DigitalOcean:** Connect your GitHub repository and configure the build and run commands.

---

## 🛡️ Security

Security is a top priority. Please follow these best practices to keep your bot secure.

### Best Practices

- **NEVER** commit your `.env` file to version control.
- Use a separate wallet for the bot with a limited amount of funds.
- Rotate your API keys regularly.
- Use a secure RPC endpoint from a trusted provider.
- Monitor the bot's activity and wallet transactions.

---

## ❓ Troubleshooting

If you encounter any issues, this section might help.

### Common Issues

- **"Insufficient balance":** Your wallet doesn't have enough funds to create the bounty. Send more funds to the bot's wallet.
- **"Invalid BOT_PRIVATE_KEY":** Your private key is not valid. Make sure it starts with `0x` and is 64 characters long.
- **"Invalid OPENAI_API_KEY":** Your OpenAI API key is not valid. Make sure it starts with `sk-`.
- **"Cannot connect to RPC":** The bot can't connect to the RPC endpoint. Check your `RPC_URL` and internet connection.

### Diagnostic Commands

- `npm run test`: Runs the test suite to check for issues.
- `npm run typecheck`: Validates the TypeScript types.
- `LOG_LEVEL=debug npm run agent:outside`: Runs the bot in debug mode for more detailed logs.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps to contribute:

1.  Fork the repository.
2.  Create a new feature branch.
3.  Make your changes.
4.  Add tests for your changes.
5.  Ensure that all tests pass.
6.  Submit a pull request.

We have a [Code of Conduct](./CODE_OF_CONDUCT.md) that all contributors are expected to follow.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
