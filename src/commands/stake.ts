import chalk from "chalk";
import ora from "ora";
import { createClient, requirePrivateKey } from "../config";

export async function stakeCommand(
  amount: string,
  options: { json?: boolean },
) {
  requirePrivateKey();
  const spinner = ora(`Staking ${amount} 7N7D...`).start();
  try {
    const client = createClient();
    const result = await client.staking.stake(amount);
    spinner.succeed("Staking successful!");

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`\n  Amount:    ${chalk.green(amount)} 7N7D`);
    console.log(`  Tx Hash:   ${chalk.cyan(result.txHash)}`);
    console.log(`  Explorer:  ${chalk.underline(result.explorerLink)}\n`);
  } catch (err: any) {
    spinner.fail("Staking failed");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
