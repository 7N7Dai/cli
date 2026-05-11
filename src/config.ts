import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SevenNSevenD, type SevenNSevenDConfig } from "@7n7d/sdk";

interface FileConfig {
  apiKey?: string;
  apiUrl?: string;
  rpcUrl?: string;
  privateKey?: string;
  network?: "testnet" | "mainnet";
}

function loadFileConfig(): FileConfig {
  const configPath = path.join(os.homedir(), ".7n7d", "config.json");
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch {
    // ignore malformed config
  }
  return {};
}

export function createClient(): SevenNSevenD {
  const fileConfig = loadFileConfig();

  const config: SevenNSevenDConfig = {
    apiKey:
      process.env.SEVEN_N_SEVEN_D_API_KEY ||
      fileConfig.apiKey ||
      "",
    apiUrl:
      process.env.SEVEN_N_SEVEN_D_API_URL ||
      fileConfig.apiUrl,
    rpcUrl:
      process.env.SEVEN_N_SEVEN_D_RPC_URL ||
      fileConfig.rpcUrl,
    privateKey:
      process.env.SEVEN_N_SEVEN_D_PRIVATE_KEY ||
      fileConfig.privateKey,
    network:
      (process.env.SEVEN_N_SEVEN_D_NETWORK as "testnet" | "mainnet") ||
      fileConfig.network ||
      "testnet",
  };

  if (!config.apiKey) {
    console.error(
      "Error: API key required. Set SEVEN_N_SEVEN_D_API_KEY env var or add to ~/.7n7d/config.json",
    );
    process.exit(1);
  }

  return new SevenNSevenD(config);
}

export function requirePrivateKey(): void {
  const fileConfig = loadFileConfig();
  const pk =
    process.env.SEVEN_N_SEVEN_D_PRIVATE_KEY || fileConfig.privateKey;
  if (!pk) {
    console.error(
      "Error: Private key required for on-chain transactions. Set SEVEN_N_SEVEN_D_PRIVATE_KEY env var or add to ~/.7n7d/config.json",
    );
    process.exit(1);
  }
}
