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
    chainId: "TODO FILL OUT",
    restUrl: "TODO FILL OUT",
    rpcUrl: "TODO FILL OUT",
    seiTranslator: "TODO FILL OUT"
  },
} : {
  environment: Environment.TESTNET,
  seiConfiguration: {
    chainId: "atlantic-2",
    restUrl: "https://sei-testnet-api.polkachu.com",
    rpcUrl: "https://sei-testnet-rpc.polkachu.com",
    seiTranslator: "sei1dkdwdvknx0qav5cp5kw68mkn3r99m3svkyjfvkztwh97dv2lm0ksj6xrak"
  },
};