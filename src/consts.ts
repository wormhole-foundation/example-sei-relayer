import { Environment } from "@wormhole-foundation/relayer-engine";

declare type Config = {
  environment: Environment,
  seiConfiguration: {
    chainId: string,
    restUrl: string,
    rpcUrl: string,
    seiTranslator: string,
  },
};

export const CONFIG: Config = process.env.NODE_ENVIRONMENT === "production" ? {
  environment: Environment.MAINNET,
  seiConfiguration: {
    chainId: "pacific-1",
    restUrl: process.env.SEI_REST_URL,
    rpcUrl: process.env.SEI_RPC_URL,
    seiTranslator: "TODO FILL OUT"
  },
} : {
  environment: Environment.TESTNET,
  seiConfiguration: {
    chainId: "atlantic-2",
    restUrl: process.env.SEI_REST_URL || "https://sei-testnet-api.polkachu.com",
    rpcUrl: process.env.SEI_RPC_URL || "https://sei-testnet-rpc.polkachu.com",
    seiTranslator: "sei1dkdwdvknx0qav5cp5kw68mkn3r99m3svkyjfvkztwh97dv2lm0ksj6xrak"
  },
};