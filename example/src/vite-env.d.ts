/// <reference types="vite/client" />

import '@nervosnetwork/ckb-types';

declare global {
  interface Window {
    unisat?: any;
    okxwallet?: any;
    ethereum?: any;
  }
}
