import { Next } from "@wormhole-foundation/relayer-engine";
import { MyRelayerContext } from "./app";
import { calculateFee } from "@cosmjs/stargate";
import { fromUint8Array } from "js-base64";
import { getSeiSigningWasmClient } from "./sei";
import { CONFIG } from "./consts";

export class ApiController {
  processFundsTransfer = async (ctx: MyRelayerContext, next: Next) => {
    ctx.wallets.onSei(async (wallet, chainId) => {

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
      const fee = calculateFee(750000, "0.1usei");

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
