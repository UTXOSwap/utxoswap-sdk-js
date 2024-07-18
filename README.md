<p align="center">
  <a href="https://utxoswap-sdk-demo.vercel.app/">
    <img alt="Logo" src="https://storage.utxoswap.xyz/images/seagull.svg" width="40%" />
  </a>
</p>

<h1 align="center" style="font-size: 64px;">
  UTXO Swap SDK
</h1>

## Preview

This project is still under active development, and we are looking forward to your feedback. [View demo page here](https://utxoswap-sdk-demo.vercel.app/).

## Using Example

Install packages:

```bash
$ yarn 
```

Build SDK:

```bash
$ yarn build
$ yarn link
```

Run example:

```bash
$ cd example/ 
$ yarn
$ yarn link @utxoswap/swap-sdk-js
$ yarn dev
```

## Usage

Install packages:

```bash
$ yarn add @utxoswap/swap-sdk-js
```

Once the package is installed, you can import the library using `import` or `require` approach:

```typescript
import { Collector, Token, Client, Pool } from '@utxoswap/swap-sdk-js';

/// for CKB on chain query
const collector = new Collector({ ckbIndexerUrl });

/// for utxo swap backend service
const apiKey = "your api key"
const client = new Client(false, apiKey);

/// get existed pools
const { list: pools } = await client.getPoolsByToken({
  pageNo: 0,
  pageSize: 10,
  searchKey: "0x0000000000000000000000000000000000000000000000000000000000000000",
});

/// pool instance
const pool = new Pool({
  tokens,
  ckbAddress: address,
  collector,
  client,
  poolInfo,
});

/// calculate output amount
const { output } = pool.current.calculateOutputAmountAndPriceImpactWithExactInput(
  inputValue
);

/// swap use your own sign function like ccc.signer
const intentTxHash = await pool.swapWithExactInput(
  signTxFunc, // transaction sign function
  slippage, // default 0.5, 1-100
  5000 // CKB fee rate, must equal to or greater than 5000
);
```

## Example

[You can find react example here](https://github.com/UTXOSwap/swap-sdk/tree/main/example)