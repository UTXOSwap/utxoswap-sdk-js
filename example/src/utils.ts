import { Transaction as CCCTransaction } from '@ckb-ccc/connector-react';
import { addressToScript } from '@nervosnetwork/ckb-sdk-utils';
import { append0x, leToU128 } from '@rgbpp-sdk/ckb';
import { Collector } from '@utxoswap/swap-sdk-js';

export const formatBigIntWithDecimal = (bigint: bigint, decimals: number) => {
  const scaleFactor = BigInt(10 ** decimals);
  const wholePart = bigint / scaleFactor;
  const fractionalPart = bigint % scaleFactor;

  return `${wholePart}.${fractionalPart.toString().padStart(decimals, '0')}`;
};

export const getTokenBalance = async (
  collector: Collector,
  ckbAddress: string,
  type?: CKBComponents.Script
) => {
  const fromLock = addressToScript(ckbAddress);
  let sumTokenAmount = BigInt(0);

  if (!type) {
    const ckbCells = await collector.getCells({
      lock: fromLock,
    });

    const emptyCells = ckbCells?.filter(cell => !cell.output.type);

    if (!emptyCells || emptyCells.length === 0) {
      return sumTokenAmount;
    }
    for (const cell of emptyCells) {
      sumTokenAmount += BigInt(cell.output.capacity);
    }
    return sumTokenAmount;
  }

  const xudtCells = await collector.getCells({
    lock: fromLock,
    type,
  });

  if (!xudtCells || xudtCells.length === 0) {
    return sumTokenAmount;
  }

  for (const cell of xudtCells) {
    sumTokenAmount += leToU128(cell.outputData);
  }

  return sumTokenAmount;
};

export function bigint2Hex(num: bigint): string {
  return append0x(num.toString(16));
}

export function transactionFormatter(
  transaction: CCCTransaction
): CKBComponents.RawTransaction {
  const {
    version,
    cellDeps,
    headerDeps,
    inputs,
    outputs,
    outputsData,
    witnesses,
  } = transaction;
  return {
    version: bigint2Hex(version),
    cellDeps: cellDeps.map(cell => {
      return {
        outPoint: {
          txHash: cell.outPoint.txHash,
          index: bigint2Hex(cell.outPoint.index),
        },
        depType: cell.depType,
      };
    }),
    headerDeps,
    inputs: inputs.map(input => {
      return {
        previousOutput: {
          index: bigint2Hex(input.previousOutput.index),
          txHash: input.previousOutput.txHash,
        },
        since: bigint2Hex(input.since),
      };
    }),
    outputs: outputs.map(output => {
      return {
        capacity: bigint2Hex(output.capacity),
        lock: output.lock,
        type: output.type,
      };
    }),
    outputsData: outputsData,
    witnesses,
  };
}
