import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const NETWORK_RPC_URL = process.env.NETWORK_RPC_URL;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

if (!NETWORK_RPC_URL) {
  throw new Error("Please set your NETWORK_RPC_URL in a .env file");
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: NETWORK_RPC_URL,
      accounts: [WALLET_PRIVATE_KEY],
      chainId: Number(process.env.NETWORK_CHAIN_ID) || 11155111,
    },
  },
};

export default config;
