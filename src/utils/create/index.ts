import { SignTransactionFunc, Token } from '../../types';
import {
  CKB_DECIMALS,
  CKB_TYPE_HASH,
  INTENT_LOCK_CKB_CELL_CAPACITY_FOR_CREATE_POOL,
  INTENT_LOCK_UDT_CELL_CAPACITY_FOR_CREATE_POOL,
} from '../../constant';
import { bigNumberToBigInt, swapTokens } from '../formatter';
import { Client, Collector } from '../../entities';
import {
  addressToScript,
  serializeTransaction,
} from '@nervosnetwork/ckb-sdk-utils';
import {
  calculateUdtCellCapacity,
  collectInputs,
  collectUdtInputs,
  getCellsByTypeHash,
} from '../cells-collector';
import { append0x, u128ToLe } from '@rgbpp-sdk/ckb';
import { appendCellDepsAndWitnessToUnsignedTx } from '../transaction-addons';
import { calculateCreatePoolIntentArgs } from './create-intent-args';

/// CKB-XUDT
const createPoolWithCKB = async (
  tokens: Token[],
  feeRate: bigint,
  ckbAddress: string,
  collector: Collector,
  signTransaction: SignTransactionFunc,
  client: Client
) => {
  const { isMainnet, getSequencerConfigurations, createPool } = client;

  const [ckbToken, xudtToken] = tokens;

  /// 1. query sequencer configurations
  const sequencerConfigurations = await getSequencerConfigurations();

  /// 2. user lock script
  const fromLock = addressToScript(ckbAddress);

  /// 3. calculate intent args
  const createPoolIntentBuffer = calculateCreatePoolIntentArgs(
    fromLock,
    tokens,
    sequencerConfigurations
  );

  /// 4. query user's ckb cells and xudt cells
  const [ckbCells, xudtCells] = await Promise.all([
    getCellsByTypeHash(collector, fromLock),
    getCellsByTypeHash(collector, fromLock, xudtToken.typeScript),
  ]);

  const xudtCapacity = calculateUdtCellCapacity(fromLock, xudtToken.typeScript);

  /// 5. convert use desired CKB & XUDT amount
  const desiredCKBAmount = bigNumberToBigInt(ckbToken.amount, CKB_DECIMALS);
  const desiredXUDTAmount = bigNumberToBigInt(
    xudtToken.amount,
    xudtToken.decimals
  );

  /// 6. total needed CKB cell capacity
  let needCKBCellCapacity =
    INTENT_LOCK_CKB_CELL_CAPACITY_FOR_CREATE_POOL(fromLock) +
    INTENT_LOCK_UDT_CELL_CAPACITY_FOR_CREATE_POOL(fromLock) +
    desiredCKBAmount;

  let actualInputsCapacity = BigInt(0);

  /// 7. collect xudt cell infos buy user's xudt cells and desired xudt amount
  const {
    inputs: udtInputs,
    sumInputsCapacity: sumXudtInputsCapacity,
    sumAmount: sumXudtAmount,
  } = collectUdtInputs({
    collector,
    xudtCells,
    needXudtAmount: desiredXUDTAmount,
  });
  actualInputsCapacity += sumXudtInputsCapacity;

  if (sumXudtAmount > desiredXUDTAmount) {
    needCKBCellCapacity += xudtCapacity;
  }

  /// 8. collect ckb cell infos buy user's ckb cells and total needed CKB cell capacity
  const {
    inputs: ckbInputs,
    sumInputsCapacity: sumCKBInputsCapacity,
  } = collectInputs(
    collector,
    ckbCells,
    needCKBCellCapacity - actualInputsCapacity
  );

  actualInputsCapacity += sumCKBInputsCapacity;

  /// 9. actual total inputs capacity
  const changeCapacity = actualInputsCapacity - needCKBCellCapacity;

  /// 10. construct create pool intent cells
  const outputs: CKBComponents.CellOutput[] = [
    {
      lock: {
        codeHash: sequencerConfigurations.intentLock.codeHash,
        hashType: sequencerConfigurations.intentLock.hashType,
        args: append0x(createPoolIntentBuffer.toString('hex')),
      },
      capacity: append0x(
        (
          INTENT_LOCK_CKB_CELL_CAPACITY_FOR_CREATE_POOL(fromLock) +
          desiredCKBAmount
        ).toString(16)
      ),
    },
    {
      lock: {
        codeHash: sequencerConfigurations.intentLock.codeHash,
        hashType: sequencerConfigurations.intentLock.hashType,
        args: append0x(createPoolIntentBuffer.toString('hex')),
      },
      type: xudtToken.typeScript,
      capacity: append0x(
        INTENT_LOCK_UDT_CELL_CAPACITY_FOR_CREATE_POOL(fromLock).toString(16)
      ),
    },
  ];

  const outputsData = ['0x', append0x(u128ToLe(desiredXUDTAmount))];

  /// 11. XUDT change
  if (sumXudtAmount > desiredXUDTAmount) {
    outputs.push({
      lock: fromLock,
      type: xudtToken.typeScript,
      capacity: append0x(xudtCapacity.toString(16)),
    });
    outputsData.push(append0x(u128ToLe(sumXudtAmount - desiredXUDTAmount)));
  }

  /// 12. CKB change
  outputs.push({
    lock: fromLock,
    capacity: append0x(changeCapacity.toString(16)),
  });
  outputsData.push('0x');

  const inputs = [...udtInputs, ...ckbInputs];

  const unsignedTx: CKBComponents.RawTransactionToSign = appendCellDepsAndWitnessToUnsignedTx(
    {
      version: '0x0',
      cellDeps: [],
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      witnesses: [],
    },
    changeCapacity,
    feeRate,
    isMainnet
  );
  console.log(unsignedTx);

  const signedTx = await signTransaction(unsignedTx);

  const txHex = serializeTransaction(signedTx);

  const { txHash } = await createPool(txHex);

  return txHash;
};

/// XUDT-XUDT
const createPoolWithOutCKB = async (
  tokens: Token[],
  feeRate: bigint,
  ckbAddress: string,
  collector: Collector,
  signTransaction: SignTransactionFunc,
  client: Client
) => {
  const { isMainnet, getSequencerConfigurations, createPool } = client;

  const [tokenX, tokenY] = tokens;

  /// 1. query sequencer configurations
  const sequencerConfigurations = await getSequencerConfigurations();

  /// 2. user lock script
  const fromLock = addressToScript(ckbAddress);

  /// 3. calculate intent args
  const createPoolIntentBuffer = calculateCreatePoolIntentArgs(
    fromLock,
    tokens,
    sequencerConfigurations
  );

  /// 4. query user's xudt cells
  const [ckbCells, tokenXCells, tokenYCells] = await Promise.all([
    getCellsByTypeHash(collector, fromLock),
    getCellsByTypeHash(collector, fromLock, tokenX.typeScript),
    getCellsByTypeHash(collector, fromLock, tokenY.typeScript),
  ]);

  /// 5. convert use desired CKB & XUDT amount
  const desiredTokenXAmount = bigNumberToBigInt(tokenX.amount, tokenX.decimals);
  const desiredTokenYAmount = bigNumberToBigInt(tokenY.amount, tokenY.decimals);

  /// 6. collect xudt cell infos buy user's xudt cells and desired xudt amount
  const {
    inputs: tokenXInputs,
    sumInputsCapacity: sumTokenXInputsCapacity,
    sumAmount: sumTokenXAmount,
  } = collectUdtInputs({
    collector,
    xudtCells: tokenXCells,
    needXudtAmount: desiredTokenXAmount,
  });

  const {
    inputs: tokenYInputs,
    sumInputsCapacity: sumTokenYInputsCapacity,
    sumAmount: sumTokenYAmount,
  } = collectUdtInputs({
    collector,
    xudtCells: tokenYCells,
    needXudtAmount: desiredTokenYAmount,
  });

  /// 7. total needed CKB cell capacity
  const xudtXCapacity = calculateUdtCellCapacity(fromLock, tokenX.typeScript);
  const xudtYCapacity = calculateUdtCellCapacity(fromLock, tokenY.typeScript);

  let actualInputsCapacity = sumTokenXInputsCapacity + sumTokenYInputsCapacity;

  let needCKBCellCapacity =
    INTENT_LOCK_UDT_CELL_CAPACITY_FOR_CREATE_POOL(fromLock) +
    INTENT_LOCK_UDT_CELL_CAPACITY_FOR_CREATE_POOL(fromLock);

  if (sumTokenXAmount > desiredTokenXAmount) {
    needCKBCellCapacity += xudtXCapacity;
  }

  if (sumTokenYAmount > desiredTokenYAmount) {
    needCKBCellCapacity += xudtYCapacity;
  }

  /// 8. collect ckb cell infos buy user's ckb cells and total needed CKB cell capacity
  const {
    inputs: ckbInputs,
    sumInputsCapacity: sumCKBInputsCapacity,
  } = collectInputs(
    collector,
    ckbCells,
    needCKBCellCapacity - actualInputsCapacity
  );

  /// 9. actual total inputs capacity
  actualInputsCapacity += sumCKBInputsCapacity;

  const changeCapacity = actualInputsCapacity - needCKBCellCapacity;

  /// 10. construct create pool intent cells
  const outputs: CKBComponents.CellOutput[] = [
    {
      lock: {
        codeHash: sequencerConfigurations.intentLock.codeHash,
        hashType: sequencerConfigurations.intentLock.hashType,
        args: append0x(createPoolIntentBuffer.toString('hex')),
      },
      type: tokenX.typeScript,
      capacity: append0x(
        INTENT_LOCK_UDT_CELL_CAPACITY_FOR_CREATE_POOL(fromLock).toString(16)
      ),
    },
    {
      lock: {
        codeHash: sequencerConfigurations.intentLock.codeHash,
        hashType: sequencerConfigurations.intentLock.hashType,
        args: append0x(createPoolIntentBuffer.toString('hex')),
      },
      type: tokenY.typeScript,
      capacity: append0x(
        INTENT_LOCK_UDT_CELL_CAPACITY_FOR_CREATE_POOL(fromLock).toString(16)
      ),
    },
  ];

  const outputsData = [
    append0x(u128ToLe(desiredTokenXAmount)),
    append0x(u128ToLe(desiredTokenYAmount)),
  ];

  /// 11. XUDT change
  if (sumTokenXAmount > desiredTokenXAmount) {
    outputs.push({
      lock: fromLock,
      type: tokenX.typeScript,
      capacity: append0x(xudtXCapacity.toString(16)),
    });
    outputsData.push(append0x(u128ToLe(sumTokenXAmount - desiredTokenXAmount)));
  }

  if (sumTokenYAmount > desiredTokenYAmount) {
    outputs.push({
      lock: fromLock,
      type: tokenY.typeScript,
      capacity: append0x(xudtYCapacity.toString(16)),
    });
    outputsData.push(append0x(u128ToLe(sumTokenYAmount - desiredTokenYAmount)));
  }

  /// 12. CKB change
  outputs.push({
    lock: fromLock,
    capacity: append0x(changeCapacity.toString(16)),
  });

  outputsData.push('0x');

  const inputs = [...ckbInputs, ...tokenXInputs, ...tokenYInputs];

  const unsignedTx: CKBComponents.RawTransactionToSign = appendCellDepsAndWitnessToUnsignedTx(
    {
      version: '0x0',
      cellDeps: [],
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      witnesses: [],
    },
    changeCapacity,
    feeRate,
    isMainnet
  );

  const signedTx = await signTransaction(unsignedTx);

  const txHex = serializeTransaction(signedTx);

  const { txHash } = await createPool(txHex);

  return txHash;
};

export const exactCreatePool = async (
  feeRate: bigint,
  ckbAddress: string,
  originalTokens: Token[],
  collector: Collector,
  client: Client,
  signTransaction: SignTransactionFunc
) => {
  const tokens = swapTokens(originalTokens);

  const hasCKBToken = tokens.some(token => token.typeHash === CKB_TYPE_HASH);

  if (hasCKBToken) {
    return await createPoolWithCKB(
      tokens,
      feeRate,
      ckbAddress,
      collector,
      signTransaction,
      client
    );
  } else {
    return await createPoolWithOutCKB(
      tokens,
      feeRate,
      ckbAddress,
      collector,
      signTransaction,
      client
    );
  }
};
