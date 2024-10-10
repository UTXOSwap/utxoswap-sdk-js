export enum IntentType {
  CreatePool = 0,
  AddLiquidity,
  RemoveLiquidity,
  SwapExactInputForOutput,
  SwapInputForExactOutput,
  ClaimProtocolLiquidity,
}

export type Hex = string;
export type Byte = number;
export type Byte2 = number;
export type Byte32 = string;
export type U8 = number;
export type U128 = bigint;
export type Bytes = string;
export type Address = string;
export type Capacity = bigint;

export interface TypeScript {
  args: string;
  codeHash: string;
  hashType: string;
}

export interface Token {
  symbol: string;
  decimals: number;
  name?: string;
  logo?: string;
  balance?: string;
  amount?: string;
  reserve?: string;
  typeHash: string;
  typeScript?: CKBComponents.Script;
}

export interface PoolInfo {
  assetX: Token;
  assetY: Token;
  basedAsset: number;
  batchId: number;
  feeRate: number;
  protocolLpAmount: string;
  totalLpSupply: string;
  typeHash: Hex;
  poolShare: string;
  LPToken: string;
  tvl: string;
  dayTxsCount: string;
  dayVolume: string;
  dayApr: string;
}

export enum PoolStatus {
  NotCreate = 0,
  Pending,
  Created,
}

export interface PoolResponse {
  pool?: PoolInfo;
  status: PoolStatus;
}

export interface PoolsResponse {
  list: Array<PoolInfo>;
  totalCount: number;
}

export interface TokenResponse {
  list: Array<Token>;
}

export interface SequencerConfigurations {
  allowedFeeRates: number[];
  protocolFeePercent: number;
  intentLock: {
    cellDep: CKBComponents.CellDep;
    codeHash: CKBComponents.Hash256;
    hashType: CKBComponents.ScriptHashType;
  };
  lpType: {
    cellDep: CKBComponents.CellDep;
    codeHash: CKBComponents.Hash256;
    hashType: CKBComponents.ScriptHashType;
  };
  proxyLock: {
    cellDep: CKBComponents.CellDep;
    codeHash: CKBComponents.Hash256;
    hashType: CKBComponents.ScriptHashType;
  };
  sequencerLockHash: CKBComponents.Hash256;
  sequencerProxyLock: {
    cellDep: CKBComponents.CellDep;
    codeHash: CKBComponents.Hash256;
    hashType: CKBComponents.ScriptHashType;
  };
  xudt: {
    cellDep: CKBComponents.CellDep;
    codeHash: CKBComponents.Hash256;
    hashType: CKBComponents.ScriptHashType;
  };
}

export enum IntentStatus {
  NotCreate = 0,
  Pending,
  Created,
}

export interface IntentResponse {
  txHash: string;
  status: IntentStatus;
}

export type SignTransactionFunc = (
  rawTx: CKBComponents.RawTransactionToSign
) => Promise<CKBComponents.RawTransaction>;
