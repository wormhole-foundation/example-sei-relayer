import { Next, ParsedVaaWithBytes } from "@wormhole-foundation/relayer-engine";
import { MyRelayerContext } from "./app";
import { calculateFee } from "@cosmjs/stargate";
import { fromUint8Array } from "js-base64";
import { getSeiSigningWasmClient } from "./sei";
import { CONFIG } from "./consts";
import { CHAIN_ID_SEI, TokenBridgePayload, parseTokenTransferPayload } from "@certusone/wormhole-sdk";

export class ApiController {
  preFilter(vaa: ParsedVaaWithBytes): boolean {
    const payload = parseTokenTransferPayload(vaa.payload);

    // 1. Make sure it's a token transfer payload3 VAA
    if (payload.payloadType !== TokenBridgePayload.TransferWithPayload) {
      return false;
    }

    // 2. Make sure it's going to Sei
    if (payload.toChain !== CHAIN_ID_SEI) {
      return false;
    }

    return true;
  }


  processFundsTransfer = async (ctx: MyRelayerContext, next: Next) => {
    await ctx.wallets.onSei(async (wallet, chainId) => {

      // get signed VAA bytes
      const signedVaa = ctx.vaaBytes;
      if (!signedVaa) {
        ctx.logger.error("received a vaa but no signed vaa bytes... skipping");
        await next();
        return;
      }

      // submit the VAA to the Sei token_translator contract
      const msg = {
        complete_transfer_and_convert: {
          vaa: fromUint8Array(signedVaa),
        },
      };
      const fee = calculateFee(1000000, "0.1usei");

      const signingClient = await getSeiSigningWasmClient(wallet.wallet);
      const tx = await signingClient.execute(
        wallet.address,
        CONFIG.seiConfiguration.seiTranslator,
        msg,
        fee,
        "Wormhole - Complete Transfer"
      );
  
      ctx.logger.info(`Submitted complete transfer to Sei with hash ${tx.transactionHash}`);
    });

    // continue to next middleware
    await next();
  };
}
