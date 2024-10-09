import { append0x, remove0x, u128ToLe } from '@rgbpp-sdk/ckb';
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils';
import {
  CKB_TYPE_HASH,
  CREATE_POOL_INTENT_ARGS_BUFFER_LENGTH,
} from '../../constant';
import { IntentType, SequencerConfigurations, Token } from '../../types';
import { bigNumberToBigInt } from '../formatter';

export const calculateCreatePoolIntentArgs = (
  fromLock: CKBComponents.Script,
  tokens: Token[],
  sequencerConfigurations: SequencerConfigurations
): Buffer => {
  const [tokenX, tokenY] = tokens;
  const desiredTokenXAmount = bigNumberToBigInt(tokenX.amount, tokenX.decimals);
  const desiredTokenYAmount = bigNumberToBigInt(tokenY.amount, tokenY.decimals);

  const rawIntentArgs = {
    owner_lock_hash: append0x(scriptToHash(fromLock)),
    pool_type_hash: CKB_TYPE_HASH,
    tx_fee: 0,
    expire_batch_id: 1,
    intent_type: IntentType.CreatePool,
    intent_data: {
      total_fee_rate: sequencerConfigurations.allowedFeeRates?.[1] || 3,
      asset_x: tokenX.typeHash,
      asset_y: tokenY.typeHash,
      amount_x: desiredTokenXAmount,
      amount_y: desiredTokenYAmount,
    },
  };

  const createPoolIntentBuffer = Buffer.alloc(
    CREATE_POOL_INTENT_ARGS_BUFFER_LENGTH
  );

  let index = 0;

  createPoolIntentBuffer.write(
    remove0x(rawIntentArgs.owner_lock_hash),
    index,
    20,
    'hex'
  );

  index += 20;

  createPoolIntentBuffer.write(
    remove0x(rawIntentArgs.pool_type_hash),
    index,
    20,
    'hex'
  );

  index += 20;

  createPoolIntentBuffer.write(
    rawIntentArgs.tx_fee.toString(16),
    index,
    8,
    'hex'
  );

  index += 8;

  createPoolIntentBuffer.write(
    rawIntentArgs.expire_batch_id.toString(16),
    index,
    8,
    'hex'
  );

  index += 8;

  createPoolIntentBuffer.writeUint8(rawIntentArgs.intent_type, index);

  index += 1;

  createPoolIntentBuffer.writeUint8(
    rawIntentArgs.intent_data.total_fee_rate,
    index
  );

  index += 1;

  createPoolIntentBuffer.write(
    remove0x(rawIntentArgs.intent_data.asset_x),
    index,
    32,
    'hex'
  );

  index += 32;

  createPoolIntentBuffer.write(
    remove0x(rawIntentArgs.intent_data.asset_y),
    index,
    32,
    'hex'
  );

  index += 32;

  createPoolIntentBuffer.write(
    u128ToLe(rawIntentArgs.intent_data.amount_x),
    index,
    16,
    'hex'
  );

  index += 16;

  createPoolIntentBuffer.write(
    u128ToLe(rawIntentArgs.intent_data.amount_y),
    index,
    16,
    'hex'
  );

  index += 16;

  return createPoolIntentBuffer;
};
