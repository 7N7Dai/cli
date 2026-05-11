import chalk from "chalk";
import ora from "ora";
import { createClient, requirePrivateKey } from "../config";

export async function withdrawCommand(
  shares: string,
  options: { json?: boolean },
) {
  requirePrivateKey();
  const spinner = ora(`Requesting withdrawal of ${shares} shares...`).start();
  try {
    const client = createClient();
    const result = await client.vault.withdraw(shares);
    spinner.succeed("Withdrawal request submitted!");

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`\n  Shares:    ${chalk.green(shares)}`);
    console.log(`  Tx Hash:   ${chalk.cyan(result.txHash)}`);
    console.log(`  Explorer:  ${chalk.underline(result.explorerLink)}`);
    console.log(chalk.dim("\n  Note: 7-day withdrawal lock applies.\n"));
  } catch (err: any) {
    spinner.fail("Withdrawal request failed");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
