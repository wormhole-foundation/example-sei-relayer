import { getCosmWasmClient, getQueryClient, getSigningCosmWasmClient } from "@sei-js/core";
import { fromUint8Array } from "js-base64";
import { CONFIG } from "./consts";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";

export const getSeiWasmClient = () =>
  getCosmWasmClient(CONFIG.seiConfiguration.rpcUrl);

export const getSeiSigningWasmClient = async (wallet: DirectSecp256k1Wallet) =>
  getSigningCosmWasmClient(CONFIG.seiConfiguration.rpcUrl, wallet);

export const getSeiQueryClient = () =>
  getQueryClient(CONFIG.seiConfiguration.restUrl);

export type CosmWasmClient = {
  queryContractSmart: (address: string, queryMsg: any) => Promise<any>;
};

/**
 * Return if the VAA has been redeemed or not
 * @param tokenBridgeAddress The Sei token bridge contract address
 * @param signedVAA The signed VAA byte array
 * @param client Holds the wallet and signing information
 * @returns true if the VAA has been redeemed.
 */
export async function getIsTransferCompletedSei(
  tokenBridgeAddress: string,
  signedVAA: Uint8Array,
  client: CosmWasmClient
): Promise<boolean> {
  const queryResult = await client.queryContractSmart(tokenBridgeAddress, {
    is_vaa_redeemed: {
      vaa: fromUint8Array(signedVAA),
    },
  });
  return queryResult.is_redeemed;
}

export function parseSequenceFromLogSei(info: any): string {
  // Scan for the Sequence attribute in all the outputs of the transaction.
  let sequence = "";
  info.logs.forEach((row: any) => {
    row.events.forEach((event: any) => {
      event.attributes.forEach((attribute: any) => {
        if (attribute.key === "message.sequence") {
          sequence = attribute.value;
        }
      });
    });
  });
  return sequence.toString();
}