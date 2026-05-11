import chalk from "chalk";
import ora from "ora";
import { createClient } from "../config";

export async function chatCommand(
  message: string,
  options: { json?: boolean },
) {
  const spinner = ora("Sending message to agent...").start();
  try {
    const client = createClient();
    const result = await client.api.chat(message);
    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(result.data, null, 2));
      return;
    }

    console.log(chalk.bold("\nAgent Response\n"));
    console.log(`  ${result.data.response}\n`);
    if (result.data.intent !== "general") {
      console.log(chalk.dim(`  Intent: ${result.data.intent}`));
    }
    console.log();
  } catch (err: any) {
    spinner.fail("Chat failed");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
