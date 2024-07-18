import { CKB_UNIT } from '@rgbpp-sdk/ckb';
import { MIN_CAPACITY } from './common';

// TODO: compatible with Nostr lock
export const INTENT_LOCK_CKB_CELL_CAPACITY_FOR_SWAP = BigInt(144_0000_0000);

export const INTENT_LOCK_UDT_CELL_CAPACITY_FOR_SWAP = BigInt(212_0000_0000);

export const SWAP_EXACT_INPUT_FOR_OUTPUT_INTENT_ARGS_BUFFER_LENGTH =
  56 + 1 + 1 + 16 + 16;

export const DEFAULT_UDT_ARGS_SIZE = 32;

export const SWAP_OCCUPIED_CKB_AMOUNT =
  INTENT_LOCK_CKB_CELL_CAPACITY_FOR_SWAP + MIN_CAPACITY + CKB_UNIT;
