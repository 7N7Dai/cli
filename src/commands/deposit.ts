import chalk from "chalk";
import ora from "ora";
import { createClient, requirePrivateKey } from "../config";

export async function depositCommand(
  amount: string,
  options: { json?: boolean },
) {
  requirePrivateKey();
  const spinner = ora(`Depositing ${amount} USDC...`).start();
  try {
    const client = createClient();
    const result = await client.vault.deposit(amount);
    spinner.succeed("Deposit successful!");

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`\n  Amount:    ${chalk.green(amount)} USDC`);
    console.log(`  Tx Hash:   ${chalk.cyan(result.txHash)}`);
    console.log(`  Explorer:  ${chalk.underline(result.explorerLink)}\n`);
  } catch (err: any) {
    spinner.fail("Deposit failed");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
