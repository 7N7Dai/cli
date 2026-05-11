import { Command } from "commander";
import { statusCommand } from "./commands/status";
import { positionsCommand } from "./commands/positions";
import { depositCommand } from "./commands/deposit";
import { withdrawCommand } from "./commands/withdraw";
import { balanceCommand } from "./commands/balance";
import { stakeCommand } from "./commands/stake";
import { unstakeCommand } from "./commands/unstake";
import { rewardsCommand } from "./commands/rewards";
import { chatCommand } from "./commands/chat";
import { delegateDepositCommand } from "./commands/delegate-deposit";

const program = new Command();

program
  .name("7n7d")
  .description("CLI for the 7N7D protocol")
  .version("0.1.0");

program
  .command("status")
  .description("Show vault status, TVL, and positions")
  .option("--json", "Output as JSON")
  .action(statusCommand);

program
  .command("positions")
  .description("List open trading positions")
  .option("--json", "Output as JSON")
  .action(positionsCommand);

program
  .command("deposit")
  .description("Deposit USDC to vault")
  .argument("<amount>", "Amount of USDC to deposit")
  .option("--json", "Output as JSON")
  .action(depositCommand);

program
  .command("withdraw")
  .description("Request withdrawal of vault shares")
  .argument("<shares>", "Number of shares to withdraw")
  .option("--json", "Output as JSON")
  .action(withdrawCommand);

program
  .command("balance")
  .description("Show vault + token balances")
  .argument("[address]", "Ethereum address (defaults to wallet)")
  .option("--json", "Output as JSON")
  .action(balanceCommand);

program
  .command("stake")
  .description("Stake 7N7D tokens")
  .argument("<amount>", "Amount of 7N7D to stake")
  .option("--json", "Output as JSON")
  .action(stakeCommand);

program
  .command("unstake")
  .description("Unstake 7N7D tokens")
  .argument("<amount>", "Amount of 7N7D to unstake")
  .option("--json", "Output as JSON")
  .action(unstakeCommand);

program
  .command("rewards")
  .description("Show pending USDC rewards")
  .argument("[address]", "Ethereum address")
  .option("--json", "Output as JSON")
  .action(rewardsCommand);

program
  .command("chat")
  .description("Chat with the AI agent")
  .argument("<message>", "Message to send")
  .option("--json", "Output as JSON")
  .action(chatCommand);

program
  .command("delegate-deposit")
  .description("Build a delegation for trustless vault deposits (ERC-7710)")
  .argument("<amount>", "Maximum USDC amount the agent can deposit")
  .argument("<agent-address>", "Ethereum address of the 7N7D agent")
  .option("--json", "Output as JSON")
  .option("--expiry <date>", "Expiry date in ISO 8601 format (default: no expiry)")
  .option("--network <network>", "Network: testnet or mainnet", "testnet")
  .action(delegateDepositCommand);

program.parse();
