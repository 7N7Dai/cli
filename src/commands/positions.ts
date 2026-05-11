import chalk from "chalk";
import ora from "ora";
import { createClient } from "../config";

export async function positionsCommand(options: { json?: boolean }) {
  const spinner = ora("Fetching positions...").start();
  try {
    const client = createClient();
    const result = await client.api.positions();
    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(result.data, null, 2));
      return;
    }

    const { positions } = result.data;
    console.log(chalk.bold("\nOpen Positions\n"));

    if (positions.length === 0) {
      console.log("  No open positions.\n");
      return;
    }

    for (const pos of positions) {
      console.log(chalk.dim("  ─────────────────────────────────"));
      for (const [key, value] of Object.entries(pos)) {
        console.log(`  ${chalk.cyan(key.padEnd(16))} ${value}`);
      }
    }
    console.log();
  } catch (err: any) {
    spinner.fail("Failed to fetch positions");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
