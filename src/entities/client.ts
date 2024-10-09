import axios from 'axios';
import { MAINNET_BACKEND_URL, TESTNET_BACKEND_URL } from '../constant';
import {
  Hex,
  IntentResponse,
  PoolResponse,
  PoolsResponse,
  SequencerConfigurations,
  Token,
} from '../types';

interface Response<T> {
  message?: string;
  code: number;
  data: T;
}

export class Client {
  private readonly url: string;
  private readonly timeout: number;
  public readonly isMainnet: boolean;
  private readonly apiKey: string;

  constructor(isMainnet = false, apiKey = '', timeout = 30000) {
    this.url = isMainnet ? MAINNET_BACKEND_URL : TESTNET_BACKEND_URL;
    this.isMainnet = isMainnet;
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  getPoolByTokens = async (tokens: [Token, Token]) => {
    const apiKey = this.apiKey;
    const res = await axios<Response<PoolResponse>>(
      '/api/v1/sequencer/pool/get_pool_by_tokens',
      {
        baseURL: this.url,
        timeout: this.timeout,
        method: 'post',
        headers: {
          'x-api-key': apiKey,
        },
        data: {
          assetXTypeHash: tokens[0].typeHash,
          assetYTypeHash: tokens[1].typeHash,
        },
      }
    );

    return res.data.data;
  };

  getSequencerConfigurations = async () => {
    const baseURL = this.url;
    const timeout = this.timeout;
    const apiKey = this.apiKey;
    const res = await axios<Response<SequencerConfigurations>>(
      '/api/v1/sequencer/configurations',
      {
        baseURL,
        timeout,
        method: 'get',
        headers: {
          'x-api-key': apiKey,
        },
      }
    );

    return res.data.data;
  };

  getPoolsByToken = async ({
    pageNo,
    pageSize,
    poolTypeHashes,
    searchKey,
  }: {
    pageNo: number;
    pageSize: number;
    poolTypeHashes?: Array<string>;
    searchKey?: string;
  }) => {
    const apiKey = this.apiKey;
    const res = await axios<Response<PoolsResponse>>(
      '/api/v1/sequencer/pools',
      {
        baseURL: this.url,
        timeout: this.timeout,
        method: 'post',
        headers: {
          'x-api-key': apiKey,
        },
        data: {
          pageNo,
          pageSize,
          poolTypeHashes,
          searchKey,
        },
      }
    );

    return res.data.data;
  };

  swapExactInputForOutput = async (tx: Hex) => {
    const apiKey = this.apiKey;
    const res = await axios<Response<IntentResponse>>(
      '/api/v1/sequencer/intent/swap_exact_input_for_output',
      {
        baseURL: this.url,
        timeout: this.timeout,
        method: 'post',
        headers: {
          'x-api-key': apiKey,
        },
        data: { tx },
      }
    );

    return res.data.data;
  };

  createPool = async (tx: Hex) => {
    const apiKey = this.apiKey;
    const res = await axios<Response<IntentResponse>>(
      '/api/v1/sequencer/pool/create',
      {
        baseURL: this.url,
        timeout: this.timeout,
        method: 'post',
        headers: {
          'x-api-key': apiKey,
        },
        data: { tx },
      }
    );

    return res.data.data;
  };
}
