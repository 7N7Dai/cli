# @7n7d/cli

CLI tool for the [7N7D protocol](https://7n7d.com) — interact with your trading agent, vault, and positions from the terminal.

## Installation

```bash
npm install -g @7n7d/cli
# or
npx @7n7d/cli
```

## Commands

| Command | Description |
|---------|-------------|
| `7n7d status` | View agent status, positions, and performance |
| `7n7d balance` | Check vault and wallet balances |
| `7n7d positions` | List open trading positions |
| `7n7d stake` | Stake 7N7D tokens to the vault |
| `7n7d unstake` | Unstake tokens from the vault |
| `7n7d deposit` | Deposit USDC into the trading vault |
| `7n7d withdraw` | Withdraw USDC from the vault |
| `7n7d rewards` | Check staking rewards |
| `7n7d delegate-deposit` | Trustless vault deposit via ERC-7710 delegation |
| `7n7d chat` | Chat with your 7N7D AI agent |

## Configuration

```bash
# Set your API endpoint (default: https://api.7n7d.com)
7n7d config set apiUrl https://api.7n7d.com

# Set your wallet address
7n7d config set address 0xYOUR_ADDRESS
```

## Development

```bash
git clone https://github.com/7n7dai/cli
cd cli
npm install
npm run build
npm test
```

## Links

- [App](https://app.7n7d.com)
- [Docs](https://docs.7n7d.com)
- [SDK](https://github.com/7n7dai/sdk)
- [Website](https://7n7d.com)

## License

MIT — see [LICENSE](./LICENSE)
