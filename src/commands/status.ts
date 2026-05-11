import chalk from "chalk";
import ora from "ora";
import { createClient } from "../config";

export async function statusCommand(options: { json?: boolean }) {
  const spinner = ora("Fetching vault status...").start();
  try {
    const client = createClient();

    // Fetch API status + on-chain vault data in parallel
    const [apiResult, sharePrice, tvl] = await Promise.all([
      client.api.status().catch(() => null),
      client.vault.sharePrice().catch(() => null),
      client.vault.totalAssets().catch(() => null),
    ]);

    spinner.stop();

    const vault = apiResult?.data?.vault;
    const agent = apiResult?.data?.agent;

    if (options.json) {
      console.log(JSON.stringify({
        vault: {
          status: vault?.status || 'unknown',
          network: vault?.network || 'unknown',
          sharePrice: sharePrice || 'N/A',
          tvl: tvl || 'N/A',
        },
        agent: {
          status: agent?.status || 'unknown',
          positions: agent?.positions || 0,
        },
      }, null, 2));
      return;
    }

    console.log(chalk.bold("\n7N7D Vault Status\n"));
    console.log(`  Network:       ${chalk.cyan(vault?.network || 'unknown')}`);
    console.log(`  Vault:         ${chalk.green(vault?.status || 'unknown')}`);
    console.log(`  Share Price:   ${chalk.green(sharePrice ? `$${sharePrice}` : 'N/A')} USDC`);
    console.log(`  TVL:           ${chalk.green(tvl ? `$${tvl}` : 'N/A')} USDC`);
    console.log(`  Agent:         ${chalk.green(agent?.status || 'unknown')}`);
    console.log(`  Positions:     ${chalk.yellow(String(agent?.positions || 0))}`);
    console.log();
  } catch (err: any) {
    spinner.fail("Failed to fetch status");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
