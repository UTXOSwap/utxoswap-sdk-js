import BigNumber from 'bignumber.js';
import { bigNumberToBigInt } from './formatter';
import { IntentType, PoolInfo, Token } from '../types';
import { append0x, remove0x, u128ToLe } from '@rgbpp-sdk/ckb';
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils';
import { SWAP_EXACT_INPUT_FOR_OUTPUT_INTENT_ARGS_BUFFER_LENGTH } from '../constant';

export const calculateSwapTokenIntentArgs = (
  fromLock: CKBComponents.Script,
  tokens: Token[],
  slippage: BigNumber.Value,
  pool: PoolInfo
) => {
  const [tokenX, tokenY] = tokens;
  const { assetX } = pool;

  const isXToY = tokenX.typeHash === assetX.typeHash;

  const desiredTokenXAmount = bigNumberToBigInt(tokenX.amount, tokenX.decimals);

  const amountOutMin = bigNumberToBigInt(
    new BigNumber(tokenY.amount || 0).multipliedBy(
      new BigNumber(1).minus(slippage)
    ),
    tokenY.decimals
  );

  const rawIntentArgs = {
    owner_lock_hash: append0x(scriptToHash(fromLock)),
    pool_type_hash: pool.typeHash,
    tx_fee: 0,
    expire_batch_id: 0,
    intent_type: IntentType.SwapExactInputForOutput,
    intent_data: {
      asset_in_index: isXToY ? 0 : 1,
      amount_in: desiredTokenXAmount,
      amount_out_min: amountOutMin,
    },
  };

  const swapTokenIntentBuffer = Buffer.alloc(
    SWAP_EXACT_INPUT_FOR_OUTPUT_INTENT_ARGS_BUFFER_LENGTH
  );

  let index = 0;

  swapTokenIntentBuffer.write(
    remove0x(rawIntentArgs.owner_lock_hash),
    index,
    20,
    'hex'
  );

  index += 20;

  swapTokenIntentBuffer.write(
    remove0x(rawIntentArgs.pool_type_hash),
    index,
    20,
    'hex'
  );

  index += 20;

  swapTokenIntentBuffer.write(
    rawIntentArgs.tx_fee.toString(16),
    index,
    8,
    'hex'
  );

  index += 8;

  swapTokenIntentBuffer.write(
    rawIntentArgs.expire_batch_id.toString(16),
    index,
    8,
    'hex'
  );

  index += 8;

  swapTokenIntentBuffer.write(
    rawIntentArgs.intent_type.toString(16),
    index,
    1,
    'hex'
  );

  index += 1;

  swapTokenIntentBuffer.write(
    rawIntentArgs.intent_data.asset_in_index.toString(16),
    index,
    1,
    'hex'
  );

  index += 1;

  swapTokenIntentBuffer.write(
    u128ToLe(rawIntentArgs.intent_data.amount_in),
    index,
    16,
    'hex'
  );

  index += 16;

  swapTokenIntentBuffer.write(
    u128ToLe(rawIntentArgs.intent_data.amount_out_min),
    index,
    16,
    'hex'
  );

  index += 16;

  return swapTokenIntentBuffer;
};
