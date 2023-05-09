import {
  cosmos
} from "@certusone/wormhole-sdk";

export const SEI_CHAIN_CONFIGURATION = {
  chainId: "atlantic-2",
  restUrl: "https://rest.atlantic-2.seinetwork.io/",
  rpcUrl: "https://rpc.atlantic-2.seinetwork.io/",
};

export const SEI_TRANSLATOR =
  "sei1dkdwdvknx0qav5cp5kw68mkn3r99m3svkyjfvkztwh97dv2lm0ksj6xrak";
export const SEI_TRANSLATER_TARGET = cosmos.canonicalAddress(SEI_TRANSLATOR);
export const SEI_DECIMALS = 6;