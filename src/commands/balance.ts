import chalk from "chalk";
import ora from "ora";
import { createClient } from "../config";

export async function balanceCommand(
  address: string | undefined,
  options: { json?: boolean },
) {
  const spinner = ora("Fetching balances...").start();
  try {
    const client = createClient();

    if (!address) {
      spinner.fail("Address required");
      console.error(
        chalk.red(
          "Provide an address: 7n7d balance 0x... or set SEVEN_N_SEVEN_D_PRIVATE_KEY to use your wallet address.",
        ),
      );
      process.exit(1);
    }

    const [vaultBalance, tokenBalance, stakedBalance, pendingRewards] =
      await Promise.all([
        client.vault.balance(address),
        client.token.balance(address),
        client.staking.balance(address),
        client.staking.earned(address),
      ]);

    spinner.stop();

    if (options.json) {
      console.log(
        JSON.stringify(
          { address, vaultBalance, tokenBalance, stakedBalance, pendingRewards },
          null,
          2,
        ),
      );
      return;
    }

    console.log(chalk.bold(`\nBalances for ${chalk.cyan(address)}\n`));
    console.log(`  Vault Shares:      ${chalk.green(vaultBalance)}`);
    console.log(`  7N7D Token:        ${chalk.green(tokenBalance)}`);
    console.log(`  Staked 7N7D:       ${chalk.green(stakedBalance)}`);
    console.log(`  Pending Rewards:   ${chalk.yellow(pendingRewards)} USDC`);
    console.log();
  } catch (err: any) {
    spinner.fail("Failed to fetch balances");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
