import chalk from "chalk";
import ora from "ora";
import { DelegationClient, NETWORKS } from "@7n7d/sdk";

type Address = `0x${string}`;

interface DelegateDepositOptions {
  json?: boolean;
  expiry?: string;
  network?: "testnet" | "mainnet";
}

function isValidAddress(addr: string): addr is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function delegateDepositCommand(
  amount: string,
  agentAddress: string,
  options: DelegateDepositOptions,
) {
  // Validate inputs
  if (!isValidAddress(agentAddress)) {
    console.error(chalk.red("Error: Invalid agent address. Must be a 0x-prefixed 40-hex-char address."));
    process.exit(1);
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    console.error(chalk.red("Error: Amount must be a positive number."));
    process.exit(1);
  }

  const spinner = ora("Building delegation...").start();

  try {
    const network = options.network ?? "testnet";
    const contracts = NETWORKS[network].contracts;

    const client = new DelegationClient({
      agentAddress: agentAddress as Address,
      chainId: NETWORKS[network].chainId,
    });

    // Convert USDC amount to base units (6 decimals)
    const maxAmount = BigInt(Math.round(amountNum * 1e6));

    // Parse expiry
    let expiry = 0n;
    if (options.expiry) {
      const ts = Math.floor(new Date(options.expiry).getTime() / 1000);
      if (isNaN(ts) || ts <= 0) {
        spinner.fail("Invalid expiry date");
        console.error(chalk.red("Error: Invalid --expiry value. Use ISO 8601 format (e.g. 2027-01-01T00:00:00Z)."));
        process.exit(1);
      }
      expiry = BigInt(ts);
    }

    const config = {
      vaultAddress: contracts.tradingVault as Address,
      usdcAddress: contracts.usdc as Address,
      maxAmount,
      expiry,
    };

    // Build the unsigned delegation
    const delegator = "0x0000000000000000000000000000000000000000" as Address;
    const delegation = client.buildVaultDepositDelegation(delegator, config);
    const result = client.summarize(delegation, config);

    spinner.succeed("Delegation built successfully!");

    if (options.json) {
      // Serialize bigints for JSON output
      const serializable = {
        delegation: {
          ...result.delegation,
          salt: result.delegation.salt.toString(),
        },
        summary: result.summary,
        config: {
          vaultAddress: config.vaultAddress,
          usdcAddress: config.usdcAddress,
          maxAmount: config.maxAmount.toString(),
          expiry: config.expiry.toString(),
        },
      };
      console.log(JSON.stringify(serializable, null, 2));
      return;
    }

    console.log(`\n  ${chalk.bold("Delegation Summary")}`);
    console.log(`  ${chalk.dim("─".repeat(50))}`);
    console.log(`  Agent:      ${chalk.cyan(agentAddress)}`);
    console.log(`  Max Amount: ${chalk.green(amount)} USDC`);
    console.log(`  Vault:      ${chalk.cyan(contracts.tradingVault)}`);
    console.log(`  Expiry:     ${expiry === 0n ? chalk.yellow("No expiry") : chalk.yellow(options.expiry!)}`);
    console.log(`  ${chalk.dim("─".repeat(50))}`);
    console.log(`  ${chalk.dim(result.summary)}`);
    console.log();
    console.log(
      chalk.yellow("  ⚠  This delegation is unsigned. Sign with your wallet to activate."),
    );
    console.log(
      chalk.dim("  Phase 2 will add EIP-712 signing via --sign flag.\n"),
    );
  } catch (err: any) {
    spinner.fail("Failed to build delegation");
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
