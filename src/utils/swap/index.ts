import BigNumber from 'bignumber.js';
import {
  addressToScript,
  serializeTransaction,
} from '@nervosnetwork/ckb-sdk-utils';
import { append0x, u128ToLe } from '@rgbpp-sdk/ckb';
import {
  CKB_DECIMALS,
  CKB_TYPE_HASH,
  DEFAULT_FEE_DENOMINATOR,
  INTENT_LOCK_CKB_CELL_CAPACITY_FOR_SWAP,
  INTENT_LOCK_UDT_CELL_CAPACITY_FOR_SWAP,
} from '../../constant';
import { PoolInfo, SignTransactionFunc, Token } from '../../types';
import { bigNumberToBigInt, getTokenUnits } from '../../utils/formatter';
import { Client, Collector } from '../../entities';
import {
  calculateUdtCellCapacity,
  collectInputs,
  collectUdtInputs,
  getCellsByTypeHash,
} from '../../utils/cells-collector';
import { calculateSwapTokenIntentArgs } from './swap-intent-args';
import { appendCellDepsAndWitnessToUnsignedTx } from '../../utils/transaction-addons';

export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeRate: bigint
): bigint {
  const amountInWithFee =
    amountIn * (BigInt(DEFAULT_FEE_DENOMINATOR) - feeRate);
  const numerator = amountInWithFee * reserveOut;
  const denominator =
    reserveIn * BigInt(DEFAULT_FEE_DENOMINATOR) + amountInWithFee;
  const amountOut = numerator / denominator;
  return amountOut;
}

export const calculateOutputAndPriceImpactWithExactInput = (
  tokens: Token[],
  pool: PoolInfo
) => {
  const [tokenX, tokenY] = tokens;

  const amountStr = tokenX?.amount;
  const inputTypeHash = tokenX?.typeHash;
  if (!amountStr || amountStr === '0' || !inputTypeHash) {
    return { output: '', priceImpact: '', buyPrice: '' };
  }

  const { assetX, assetY, feeRate = 30 } = pool;

  const reserveX = BigInt(assetX.reserve || '0');
  const reserveY = BigInt(assetY.reserve || '0');
  let output = '';
  let priceImpact = '';
  let buyPrice = '';

  if (assetX.typeHash === inputTypeHash) {
    const reserveIn = reserveX;
    const reserveOut = reserveY;
    const amountIn = bigNumberToBigInt(amountStr, tokenX.decimals);

    const amountOut = getAmountOut(
      amountIn,
      reserveIn,
      reserveOut,
      BigInt(feeRate)
    );

    output = amountOut.toString();
    buyPrice =
      amountIn > 0
        ? new BigNumber(amountOut.toString())
            .dividedBy(new BigNumber(amountIn.toString()))
            .toString()
        : '';
    priceImpact = new BigNumber(-amountOut.toString())
      .dividedBy(new BigNumber(reserveOut.toString()))
      .toString();
  } else if (assetY.typeHash === inputTypeHash) {
    const reserveIn = reserveY;
    const reserveOut = reserveX;
    const amountIn = bigNumberToBigInt(amountStr, tokenX.decimals);
    const amountOut = getAmountOut(
      amountIn,
      reserveIn,
      reserveOut,
      BigInt(feeRate)
    );

    output = amountOut.toString();
    buyPrice =
      amountIn > 0
        ? new BigNumber(amountOut.toString())
            .dividedBy(new BigNumber(amountIn.toString()))
            .toString()
        : '';
    priceImpact = new BigNumber(-amountOut.toString())
      .dividedBy(new BigNumber(reserveOut.toString()))
      .toString();
  }

  return {
    output: getTokenUnits(output, tokenY.decimals),
    buyPrice,
    priceImpact: priceImpact.toString(),
  };
};

const swapCKBToUDT = async (
  tokens: Token[],
  slippage: BigNumber.Value,
  feeRate: bigint,
  ckbAddress: string,
  pool: PoolInfo,
  collector: Collector,
  signTransaction: SignTransactionFunc,
  client: Client
) => {
  const {
    isMainnet,
    getSequencerConfigurations,
    swapExactInputForOutput,
  } = client;

  const [ckbToken] = tokens;

  const sequencerConfigurations = await getSequencerConfigurations();

  const fromLock = addressToScript(ckbAddress);

  const createPoolIntentBuffer = calculateSwapTokenIntentArgs(
    fromLock,
    tokens,
    slippage,
    pool
  );

  const ckbCells = await getCellsByTypeHash(collector, fromLock);

  const desiredCKBAmount = bigNumberToBigInt(ckbToken.amount, CKB_DECIMALS);

  const needCKBCellCapacity =
    INTENT_LOCK_CKB_CELL_CAPACITY_FOR_SWAP(fromLock) + desiredCKBAmount;

  let actualInputsCapacity = BigInt(0);

  const {
    inputs: ckbInputs,
    sumInputsCapacity: sumCKBInputsCapacity,
  } = collectInputs(collector, ckbCells, needCKBCellCapacity);

  actualInputsCapacity += sumCKBInputsCapacity;

  const changeCapacity = actualInputsCapacity - needCKBCellCapacity;

  const outputs: CKBComponents.CellOutput[] = [
    {
      lock: {
        codeHash: sequencerConfigurations.intentLock.codeHash,
        hashType: sequencerConfigurations.intentLock.hashType,
        args: append0x(createPoolIntentBuffer.toString('hex')),
      },
      capacity: append0x(
        (
          INTENT_LOCK_CKB_CELL_CAPACITY_FOR_SWAP(fromLock) + desiredCKBAmount
        ).toString(16)
      ),
    },
  ];

  const outputsData = ['0x'];

  outputs.push({
    lock: fromLock,
    capacity: append0x(changeCapacity.toString(16)),
  });
  outputsData.push('0x');

  const unsignedTx: CKBComponents.RawTransactionToSign = appendCellDepsAndWitnessToUnsignedTx(
    {
      version: '0x0',
      cellDeps: [],
      headerDeps: [],
      inputs: ckbInputs,
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

  const { txHash } = await swapExactInputForOutput(txHex);

  return txHash;
};

const swapUDTToToken = async (
  tokens: Token[],
  slippage: BigNumber.Value,
  feeRate: bigint,
  ckbAddress: string,
  pool: PoolInfo,
  collector: Collector,
  signTransaction: SignTransactionFunc,
  client: Client
) => {
  const {
    isMainnet,
    getSequencerConfigurations,
    swapExactInputForOutput,
  } = client;

  const [xudtToken] = tokens;

  const sequencerConfigurations = await getSequencerConfigurations();

  const fromLock = addressToScript(ckbAddress);

  const addLiquidityIntentBuffer = calculateSwapTokenIntentArgs(
    fromLock,
    tokens,
    slippage,
    pool
  );

  const [ckbCells, xudtCells] = await Promise.all([
    getCellsByTypeHash(collector, fromLock),
    getCellsByTypeHash(collector, fromLock, xudtToken.typeScript),
  ]);

  const xudtCapacity = calculateUdtCellCapacity(fromLock, xudtToken.typeScript);

  const desiredXUDTAmount = bigNumberToBigInt(
    xudtToken.amount,
    xudtToken.decimals
  );

  let actualInputsCapacity = BigInt(0);

  const {
    inputs: udtInputs,
    sumInputsCapacity: sumXudtInputsCapacity,
    sumAmount: actualInputsXudtAmount,
  } = collectUdtInputs({
    collector,
    xudtCells,
    needXudtAmount: desiredXUDTAmount,
  });
  actualInputsCapacity += sumXudtInputsCapacity;

  let needCKBCellCapacity = INTENT_LOCK_UDT_CELL_CAPACITY_FOR_SWAP;
  if (actualInputsXudtAmount > desiredXUDTAmount) {
    needCKBCellCapacity += xudtCapacity;
  }
  needCKBCellCapacity = needCKBCellCapacity - sumXudtInputsCapacity;

  const {
    inputs: ckbInputs,
    sumInputsCapacity: sumCKBInputsCapacity,
  } = collectInputs(collector, ckbCells, needCKBCellCapacity);
  /// 9. actual total inputs capacity
  let changeCapacity = actualInputsCapacity + sumCKBInputsCapacity;
  let changeXudtAmount = actualInputsXudtAmount;

  const outputs: CKBComponents.CellOutput[] = [
    {
      lock: {
        codeHash: sequencerConfigurations.intentLock.codeHash,
        hashType: sequencerConfigurations.intentLock.hashType,
        args: append0x(addLiquidityIntentBuffer.toString('hex')),
      },
      type: xudtToken.typeScript,
      capacity: append0x(INTENT_LOCK_UDT_CELL_CAPACITY_FOR_SWAP.toString(16)),
    },
  ];
  const outputsData = [append0x(u128ToLe(desiredXUDTAmount))];

  changeCapacity -= INTENT_LOCK_UDT_CELL_CAPACITY_FOR_SWAP;
  changeXudtAmount -= desiredXUDTAmount;

  // udt change cell
  if (changeXudtAmount > 0) {
    outputs.push({
      lock: fromLock,
      type: xudtToken.typeScript,
      capacity: append0x(xudtCapacity.toString(16)),
    });
    outputsData.push(append0x(u128ToLe(changeXudtAmount)));

    changeCapacity -= xudtCapacity;
  }

  // ckb change cell
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

  const signedTx = await signTransaction(unsignedTx);

  const txHex = serializeTransaction(signedTx);

  const { txHash } = await swapExactInputForOutput(txHex);

  return txHash;
};

export const exactInputForOutput = async (
  slippage: string,
  feeRate: bigint,
  ckbAddress: string,
  tokens: Token[],
  pool: PoolInfo,
  collector: Collector,
  client: Client,
  signTransaction: SignTransactionFunc
) => {
  if (!pool) return;

  const isCKBToUDT = tokens[0].typeHash === CKB_TYPE_HASH;
  const _slippage = new BigNumber(slippage).div(100);

  if (isCKBToUDT) {
    return await swapCKBToUDT(
      tokens,
      _slippage,
      feeRate,
      ckbAddress,
      pool,
      collector,
      signTransaction,
      client
    );
  } else {
    return await swapUDTToToken(
      tokens,
      _slippage,
      feeRate,
      ckbAddress,
      pool,
      collector,
      signTransaction,
      client
    );
  }
};
