import * as dotenv from "dotenv";
dotenv.config();

import yargs from "yargs";
import Koa from "koa";
import {
  LoggingContext,
  SourceTxContext,
  StagingAreaContext,
  StandardRelayerApp,
  StorageContext,
  TokenBridgeContext,
  WalletContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_ARBITRUM, CHAIN_ID_AVAX, CHAIN_ID_BSC, CHAIN_ID_ETH, CHAIN_ID_OPTIMISM, CHAIN_ID_POLYGON, CHAIN_ID_SEI, CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { rootLogger } from "./log";
import { ApiController } from "./controller";
import { Logger } from "winston";
import { CONFIG } from "./consts";
import Router from "koa-router";
import { Context, Next } from "koa";

export type MyRelayerContext = LoggingContext &
  StorageContext &
  SourceTxContext &
  TokenBridgeContext &
  StagingAreaContext &
  WalletContext;

const SUPPORTED_SOURCE_CHAINS = [
  CHAIN_ID_AVAX,
  CHAIN_ID_SOLANA,
  CHAIN_ID_ETH,
  CHAIN_ID_ARBITRUM,
  CHAIN_ID_OPTIMISM,
  CHAIN_ID_POLYGON,
  CHAIN_ID_BSC,
];

// You need to read in your keys
const privateKeys = {
  [CHAIN_ID_SEI]: process.env.SEI_KEYS.split(","),
};

async function main() {
  let opts: any = yargs(process.argv.slice(2)).argv;
  opts.logger = rootLogger;
  opts.privateKeys = privateKeys;

  const app = new StandardRelayerApp<MyRelayerContext>(CONFIG.environment, opts);
  const fundsCtrl = new ApiController();

  // prefilter vaas before they get put in the queue
  app.filter(fundsCtrl.preFilter);

  // listen to token bridge contracts
  app.tokenBridge(
    SUPPORTED_SOURCE_CHAINS,
    fundsCtrl.processFundsTransfer
  );

  app.listen();
  runAPI(app, rootLogger);
  runMetrics(app, rootLogger);
}

function runAPI(
  relayerApp: StandardRelayerApp<any>,
  logger: Logger
) {
  const app = new Koa();
  const router = new Router();

  router.post(
    `/vaas/:emitterChain/:emitterAddress/:sequence`,
    reprocessVaaById(rootLogger, relayerApp)
  );

  app.use(relayerApp.storageKoaUI("/"));

  app.use(router.routes());
  app.use(router.allowedMethods());

  const port = Number(process.env.SEI_UI_PORT) || 3000;
  app.listen(port, process.env.SEI_BIND_IP || "127.0.0.1", () => {
    logger.info(`Running on ${port}...`);
    logger.info(`For the UI, open http://localhost:${port}`);
    logger.info("Make sure Redis is running on port 6379 by default");
  });
}

function runMetrics(
  relayerApp: StandardRelayerApp<any>,
  logger: Logger
) {
  const app = new Koa();
  const router = new Router();

  router.get(`/metrics`, async (ctx, next) => {
    ctx.body = await relayerApp.metricsRegistry.metrics();
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  const port = process.env.SEI_METRICS_PORT || 3001;
  app.listen(port, () => {
    logger.info(`Exposing metrics on ${port}...`);
  });
}

function reprocessVaaById(rootLogger: Logger, relayer: StandardRelayerApp) {
  return async (ctx: Context, _next: Next) => {
    const { emitterChain, emitterAddress, sequence } = ctx.params;
    const logger = rootLogger.child({
      emitterChain,
      emitterAddress,
      sequence,
    });
    logger.info("fetching vaa requested by API");
    let vaa = await relayer.fetchVaa(emitterChain, emitterAddress, sequence);
    if (!vaa) {
      logger.error("fetching vaa requested by API");
      return;
    }
    relayer.processVaa(Buffer.from(vaa.bytes));
    ctx.body = "Processing";
  };
}

main();
