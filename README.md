# Earn Rebalancer

A hackathon MVP that helps DeFi users discover higher-yield vaults and rebalance their positions automatically.

## Components

| Folder | Description |
|--------|-------------|
| `web/` | Vite + React + TypeScript web app |
| `bot/` | Python Telegram bot |

---

## Web App (`web/`)

### Features

- **Wallet connect** — powered by [RainbowKit](https://rainbowkit.com) + [wagmi](https://wagmi.sh); clicking **Connect Wallet** opens the wallet-extension modal (MetaMask, Rainbow, Coinbase Wallet, WalletConnect, …)
- **Vault discovery** — fetches from the LI.FI Earn API with chain / token / protocol / APY / risk filters
- **Positions view** — shows your current yield positions for the connected wallet
- **Recommendation card** — compares your current vault vs a better one (APY + risk delta)
- **Composer execution** — calls LI.FI `/v1/quote` and shows the transaction data with a confirm UI (no on-chain execution in MVP)
- **Risk score** — computed from TVL change, APY volatility, protocol tier, and chain tier

### Quick start

```bash
cd web
cp .env.example .env          # fill in any keys you have (all optional for local dev)
npm install
npm run dev
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_EARN_BASE_URL` | _(proxy)_ | LI.FI Earn API base URL. Leave **unset** to use the built-in `/earn-api` reverse-proxy that avoids CORS issues in both dev and Vercel. |
| `VITE_LIFI_BASE_URL` | `https://li.quest` | LI.FI main API base URL |
| `VITE_LIFI_API_KEY` | _(empty)_ | LI.FI API key — optional, only for higher rate limits. Keep server-side only. |
| `VITE_WALLET_CONNECT_PROJECT_ID` | _(demo)_ | WalletConnect project ID. Get a free one at [cloud.walletconnect.com](https://cloud.walletconnect.com). Required for WalletConnect-based mobile wallets. |

### Deploy to Vercel

1. Import the repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `web`.
3. The `web/vercel.json` rewrites automatically proxy `/earn-api/*` → `https://earn.li.fi/*`, so **no `VITE_EARN_BASE_URL` env var is needed**.
4. Optionally add `VITE_WALLET_CONNECT_PROJECT_ID` in Project → Settings → Environment Variables.
5. Click **Deploy**.

---

## Telegram Bot (`bot/`)

### Features

| Command | Description |
|---------|-------------|
| `/start` | Welcome message + command list |
| `/positions <wallet>` | Show current yield positions |
| `/recommend <wallet>` | Get a rebalance recommendation |
| `/execute <wallet>` | Fetch a LI.FI quote and confirm |

### Quick start

```bash
cd bot
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # fill in TELEGRAM_BOT_TOKEN and API keys
python main.py
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Get from [@BotFather](https://t.me/BotFather) |
| `EARN_BASE_URL` | LI.FI Earn API base (default `https://earn.li.fi`) |
| `LIFI_BASE_URL` | LI.FI main API base (default `https://li.quest`) |
| `LIFI_API_KEY` | LI.FI API key |
| `WEB_APP_URL` | URL of the deployed web app (shown in /start) |

### Deploy to Render

1. Create a new **Web Service** in [Render](https://render.com).
2. Connect this repo; set **Root Directory** to `bot`.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `python main.py`
5. Add the environment variables listed above.
6. Click **Deploy**.

---

## Risk Score Formula

The risk score (0–100) combines four signals:

| Signal | Weight |
|--------|--------|
| Protocol tier (well-known = lower risk) | 0–30 |
| Chain tier (mainnet = lower risk) | 0–20 |
| TVL 7-day change (sharp drops = higher risk) | 0–25 |
| APY historical volatility (std dev) | 0–15 |
| TVL size (tiny TVL = higher risk) | 0–10 |

Labels: **Very Low** ≤20, **Low** ≤40, **Medium** ≤60, **High** ≤80, **Very High** >80.

---

## Architecture

```
earnrebalancer/
├── web/                  # Vite + React + TypeScript
│   ├── src/
│   │   ├── api/          # earn.ts, lifi.ts
│   │   ├── components/   # WalletConnect, VaultCard, ...
│   │   ├── hooks/        # useVaults, usePositions
│   │   ├── utils/        # riskScore.ts
│   │   └── types/        # index.ts
│   ├── .env.example
│   └── package.json
└── bot/                  # Python Telegram bot
    ├── api/              # earn.py, lifi.py
    ├── handlers/         # start, positions, recommend, execute
    ├── utils/            # risk.py
    ├── config.py
    ├── main.py
    ├── requirements.txt
    └── .env.example
```

