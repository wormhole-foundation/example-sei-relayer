# example-sei-relayer

Run the spy, redis, and then the relayer.

**Run a wormhole network spy**

Testnet:

```bash
docker run --platform=linux/amd64 -p 7073:7073 --entrypoint /guardiand ghcr.io/wormhole-foundation/guardiand:latest spy --nodeKey /node.key --spyRPC "[::]:7073" --network /wormhole/testnet/2/1 --bootstrap /dns4/wormhole-testnet-v2-bootstrap.certus.one/udp/8999/quic/p2p/12D3KooWAkB9ynDur1Jtoa97LBUp8RXdhzS5uHgAfdTquJbrbN7i
```

Mainnet:

```bash
docker run --platform=linux/amd64 -p 7073:7073 --entrypoint /guardiand ghcr.io/wormhole-foundation/guardiand:latest spy --nodeKey /node.key --spyRPC "[::]:7073" --network /wormhole/mainnet/2 --bootstrap /dns4/wormhole-mainnet-v2-bootstrap.certus.one/udp/8999/quic/p2p/12D3KooWQp644DK27fd3d4Km3jr7gHiuJJ5ZGmy8hH4py7fP4FP7
```

**Run redis**

```bash
docker run --rm -p 6379:6379 --name redis-docker -d redis
```

**Run the relayer**

```bash
nvm use && npm ci && npm start
```