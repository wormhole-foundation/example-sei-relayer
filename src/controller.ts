import { Next, ParsedVaaWithBytes } from "@wormhole-foundation/relayer-engine";
import { MyRelayerContext } from "./app";
import { CHAIN_ID_SEI, TokenBridgePayload, parseTokenTransferPayload } from "@certusone/wormhole-sdk";
import { calculateFee } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { fromUint8Array } from "js-base64";
import { getSeiSigningWasmClient } from "./sei";
import { SEI_TRANSLATOR } from "./consts";
import { DirectSecp256k1HdWallet, AccountData } from "@cosmjs/proto-signing";

export class ApiController {
  private seiMnemonic: string;
  private seiWallet: DirectSecp256k1HdWallet;
  private seiClient: SigningCosmWasmClient;
  private seiAccount: AccountData;

  constructor(seiMnemonic: string) {
    this.seiMnemonic = seiMnemonic;
  }

  async setup() {
    // setup sei wallet and client
    this.seiWallet = await DirectSecp256k1HdWallet.fromMnemonic(this.seiMnemonic,
      {
        prefix: "sei"
      }
    );
    [this.seiAccount] = await this.seiWallet.getAccounts();
    this.seiClient = await getSeiSigningWasmClient(this.seiWallet);
    console.log(`initialized sei wallet: ${this.seiAccount.address}`);
  }

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
    const tx = await this.seiClient.execute(
      this.seiAccount.address,
      SEI_TRANSLATOR,
      msg,
      fee,
      "Wormhole - Complete Transfer"
    );

    ctx.logger.info(`Submitted complete transfer to Sei with hash ${tx.transactionHash}`);

    // continue to next middleware
    await next();
  };
}
