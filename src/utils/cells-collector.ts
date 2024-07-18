import { CKB_UNIT, IndexerCell, remove0x } from '@rgbpp-sdk/ckb';
import { Collector } from '../entities';
import {
  InsufficientCKBCapacityError,
  InsufficientFreeUDTBalanceError,
} from '../error';
import { DEFAULT_UDT_ARGS_SIZE, MAX_FEE, MIN_CAPACITY } from '../constant';

export const getCellsByTypeHash = async (
  collector: Collector,
  fromLock: CKBComponents.Script,
  type?: CKBComponents.Script
): Promise<IndexerCell[]> => {
  if (!type) {
    const ckbCells = await collector.getCells({
      lock: fromLock,
    });

    const emptyCells = ckbCells?.filter(cell => !cell.output.type);

    if (!emptyCells || emptyCells.length === 0) {
      throw new InsufficientCKBCapacityError();
    }

    return emptyCells;
  }

  const xudtCells = await collector.getCells({
    lock: fromLock,
    type,
  });

  if (!xudtCells || xudtCells.length === 0) {
    throw new InsufficientFreeUDTBalanceError();
  }

  return xudtCells;
};

export const collectInputs = (
  collector: Collector,
  emptyCells: IndexerCell[],
  needCKBCellCapacity: bigint,
  maxFee?: bigint,
  changeCapacity?: bigint
) => {
  if (needCKBCellCapacity <= -MIN_CAPACITY) {
    return { inputs: [], sumInputsCapacity: BigInt(0), usedCells: [] };
  }

  return collector.collectInputs(
    emptyCells,
    needCKBCellCapacity,
    maxFee ?? MAX_FEE,
    {
      minCapacity: changeCapacity ?? MIN_CAPACITY,
    }
  );
};

export const collectUdtInputs = ({
  collector,
  xudtCells,
  needXudtAmount,
}: {
  collector: Collector;
  xudtCells: IndexerCell[];
  needXudtAmount: bigint;
}) => {
  return collector.collectUdtInputs({
    liveCells: xudtCells,
    needAmount: needXudtAmount,
  });
};

export const calculateUdtCellCapacity = (
  lock: CKBComponents.Script,
  udtType?: CKBComponents.Script
): bigint => {
  const lockArgsSize = remove0x(lock.args).length / 2;
  const typeArgsSize = udtType
    ? remove0x(udtType.args).length / 2
    : DEFAULT_UDT_ARGS_SIZE;
  const cellSize = 33 + lockArgsSize + 33 + typeArgsSize + 8 + 16;
  return BigInt(cellSize) * CKB_UNIT;
};
