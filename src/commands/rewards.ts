import chalk from "chalk";
import ora from "ora";
import { createClient } from "../config";

export async function rewardsCommand(
  address: string | undefined,
  options: { json?: boolean },
) {
  const spinner = ora("Fetching rewards...").start();
  try {
    const client = createClient();

    if (!address) {
      spinner.fail("Address required");
      console.error(chalk.red("Provide an address: 7n7d rewards 0x..."));
      process.exit(1);
    }

    const earned = await client.staking.earned(address);
    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify({ address, earned }, null, 2));
      return;
    }

    console.log(chalk.bold(`\nPending Rewards for ${chalk.cyan(address)}\n`));
    console.log(`  USDC Rewards:  ${chalk.yellow(earned)} USDC\n`);
  } catch (err: any) {
    spinner.fail("Failed to fetch rewards");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
