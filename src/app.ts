import * as dotenv from "dotenv";
dotenv.config();

import yargs from "yargs";
import * as Koa from "koa";
import {
  Environment,
  LoggingContext,
  SourceTxContext,
  StagingAreaContext,
  StandardRelayerApp,
  StorageContext,
  TokenBridgeContext,
  WalletContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_AVAX, CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { rootLogger } from "./log";
import { ApiController } from "./controller";
import { Logger } from "winston";

export type MyRelayerContext = LoggingContext &
  StorageContext &
  SourceTxContext &
  TokenBridgeContext &
  StagingAreaContext &
  WalletContext;

// You need to read in your keys
// const privateKeys = {
//   [CHAIN_ID_ETH]: [process.env.ETH_KEY],
// };

async function main() {
  let opts: any = yargs(process.argv.slice(2)).argv;

  const env = Environment.TESTNET;
  const app = new StandardRelayerApp<MyRelayerContext>(env, opts);
  const fundsCtrl = await buildApiController();

  // prefilter vaas before they get put in the queue
  app.filter(fundsCtrl.preFilter);

  // listen to token bridge contracts
  app.tokenBridge(
    [CHAIN_ID_AVAX, CHAIN_ID_SOLANA],
    fundsCtrl.processFundsTransfer
  );

  app.use(async (err, ctx, next) => {
    ctx.logger.error("error middleware triggered");
  }); // <-- if you pass in a function with 3 args, it'll be used to process errors (whenever you throw from your middleware)

  app.listen();
  runUI(app, opts, rootLogger);
}

async function buildApiController(): Promise<ApiController> {
  const seiMnemonic = process.env.SEI_MNEMONIC;
  if (!seiMnemonic) {
    throw new Error("sei mnemonic required");
  }
  const controller = new ApiController(seiMnemonic);
  await controller.setup();
  return controller;
}

function runUI(
  relayerApp: StandardRelayerApp<any>,
  { port }: any,
  logger: Logger
) {
  const app = new Koa();
  app.use(relayerApp.storageKoaUI("/ui"));

  app.use(async (ctx, next) => {
    if (ctx.request.method !== "GET" && ctx.request.url !== "/metrics") {
      await next();
      return;
    }

    ctx.body = await relayerApp.metricsRegistry.metrics();
  });

  port = Number(port) || 3000;
  app.listen(port, () => {
    logger.info(`Running on ${port}...`);
    logger.info(`For the UI, open http://localhost:${port}/ui`);
    logger.info("Make sure Redis is running on port 6379 by default");
  });
}

main();
