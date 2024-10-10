import { Client, Collector, Token } from '@utxoswap/swap-sdk-js';

export const isMainnet = false;
export const ckbIndexerUrl = 'https://testnet.ckbapp.dev';
export const testApiKey = 'cYztRDvbH9sDaH2HV2Ut4TpIioYVyG07pUz46Dz1';

export const CKB: Token = {
  decimals: 8,
  name: 'CKB',
  symbol: 'CKB',
  typeHash:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
};

export const tBTC: Token = {
  decimals: 8,
  name: 'Test Btc',
  symbol: 'tBtc',
  typeHash:
    '0xe6396293287fefb9f26d98eb0318fe80890908f0849226ad0c8cab2d62f1e351',
  typeScript: {
    codeHash:
      '0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb',
    args: '0xe338fcbe878c4c656ac91b296882df9edc8b56cf00ae16acb4f0f49c09bccd02',
    hashType: 'type',
  },
};

/// for CKB on chain query
export const collector = new Collector({ ckbIndexerUrl });

/// for utxo swap backend service
export const client = new Client(isMainnet, testApiKey);
