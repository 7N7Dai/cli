import chalk from "chalk";
import ora from "ora";
import { createClient, requirePrivateKey } from "../config";

export async function unstakeCommand(
  amount: string,
  options: { json?: boolean },
) {
  requirePrivateKey();
  const spinner = ora(`Unstaking ${amount} 7N7D...`).start();
  try {
    const client = createClient();
    const result = await client.staking.unstake(amount);
    spinner.succeed("Unstaking successful!");

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`\n  Amount:    ${chalk.green(amount)} 7N7D`);
    console.log(`  Tx Hash:   ${chalk.cyan(result.txHash)}`);
    console.log(`  Explorer:  ${chalk.underline(result.explorerLink)}\n`);
  } catch (err: any) {
    spinner.fail("Unstaking failed");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
