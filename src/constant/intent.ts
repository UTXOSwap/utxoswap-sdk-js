import { CKB_UNIT } from '@rgbpp-sdk/ckb';
import { MIN_CAPACITY } from './common';
import { hexToBytes } from '@nervosnetwork/ckb-sdk-utils';

const MINI_LOCK_LENGTH = BigInt(55_0000_0000);
// TODO: compatible with Nostr lock
export const INTENT_LOCK_CKB_CELL_CAPACITY_FOR_SWAP = (
  fromLock: CKBComponents.Script
) => {
  const lockCapacity =
    hexToBytes(fromLock.args).length + hexToBytes(fromLock.codeHash).length + 1;

  return (
    BigInt(144_0000_0000) - (MINI_LOCK_LENGTH - BigInt(lockCapacity) * CKB_UNIT)
  );
};

export const INTENT_LOCK_UDT_CELL_CAPACITY_FOR_SWAP = BigInt(212_0000_0000);

export const SWAP_EXACT_INPUT_FOR_OUTPUT_INTENT_ARGS_BUFFER_LENGTH =
  56 + 1 + 1 + 16 + 16;

export const DEFAULT_UDT_ARGS_SIZE = 32;

export const SWAP_OCCUPIED_CKB_AMOUNT =
  BigInt(212_0000_0000) + MIN_CAPACITY + CKB_UNIT;
