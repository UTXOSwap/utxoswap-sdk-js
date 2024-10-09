import { Client, Collector } from '@utxoswap/swap-sdk-js';

export const isMainnet = false;
export const ckbIndexerUrl = 'https://testnet.ckbapp.dev';
export const testApiKey = 'cYztRDvbH9sDaH2HV2Ut4TpIioYVyG07pUz46Dz1';

export const ckb = {
  decimals: 8,
  name: 'CKB',
  symbol: 'CKB',
  typeHash:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
};

/// for CKB on chain query
export const collector = new Collector({ ckbIndexerUrl });

/// for utxo swap backend service
export const client = new Client(isMainnet, testApiKey);
