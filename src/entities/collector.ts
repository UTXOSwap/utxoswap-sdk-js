import axios from 'axios';
import {
  toCamelcase,
  CollectConfig,
  CollectResult,
  CollectUdtResult,
  IndexerCell,
  MIN_CAPACITY,
  Hex,
  leToU128,
  IndexerError,
} from '@rgbpp-sdk/ckb';
import {
  InsufficientCKBCapacityError,
  InsufficientFreeUDTBalanceError,
} from '../error';

const parseScript = (script: CKBComponents.Script) => ({
  code_hash: script.codeHash,
  hash_type: script.hashType,
  args: script.args,
});

export class Collector {
  private ckbIndexerUrl: string;

  constructor({ ckbIndexerUrl }: { ckbIndexerUrl: string }) {
    this.ckbIndexerUrl = ckbIndexerUrl;
  }

  async getCells({
    lock,
    type,
    isDataMustBeEmpty = true,
    outputCapacityRange,
  }: {
    lock?: CKBComponents.Script;
    type?: CKBComponents.Script;
    isDataMustBeEmpty?: boolean;
    outputCapacityRange?: Hex[];
  }): Promise<IndexerCell[] | undefined | null> {
    let param: any = {
      script_search_mode: 'exact',
    };
    if (lock) {
      param = {
        ...param,
        script: parseScript(lock),
        script_type: 'lock',
        filter: {
          script: type ? parseScript(type) : null,
          output_data_len_range:
            isDataMustBeEmpty && !type ? ['0x0', '0x1'] : null,
          output_capacity_range: outputCapacityRange,
        },
      };
    } else if (type) {
      param = {
        ...param,
        script: parseScript(type),
        script_type: 'type',
      };
    }
    const payload = {
      id: Math.floor(Math.random() * 100000),
      jsonrpc: '2.0',
      method: 'get_cells',
      params: [param, 'asc', '0xC8'],
    };
    const body = JSON.stringify(payload, null, '  ');
    const response = (
      await axios({
        method: 'post',
        url: this.ckbIndexerUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
        data: body,
      })
    ).data;
    if (response.error) {
      throw new IndexerError('Get cells error');
    } else {
      return toCamelcase(response.result.objects);
    }
  }

  async getLPCells(
    lock: CKBComponents.Script,
    script: CKBComponents.Script
  ): Promise<IndexerCell[] | undefined | null> {
    const params = {
      script_search_mode: 'exact',
      script: parseScript(lock),
      script_type: 'lock',
      filter: {
        script: parseScript({ ...script, args: '0x' }),
        script_len_range: ['0x45', '0x46'],
      },
    };

    const payload = {
      id: Math.floor(Math.random() * 100000),
      jsonrpc: '2.0',
      method: 'get_cells',
      params: [params, 'asc', '0xC8'],
    };

    const body = JSON.stringify(payload, null, '  ');

    const response = (
      await axios({
        method: 'post',
        url: this.ckbIndexerUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
        data: body,
      })
    ).data;
    if (response.error) {
      throw new IndexerError('Get cells error');
    } else {
      return toCamelcase(response.result.objects);
    }
  }

  collectInputs(
    liveCells: IndexerCell[],
    needCapacity: bigint,
    fee: bigint,
    config?: CollectConfig
  ): CollectResult {
    const changeCapacity = config?.minCapacity ?? MIN_CAPACITY;
    const inputs: CKBComponents.CellInput[] = [];
    let sumInputsCapacity = BigInt(0);
    for (const cell of liveCells) {
      inputs.push({
        previousOutput: {
          txHash: cell.outPoint.txHash,
          index: cell.outPoint.index,
        },
        since: '0x0',
      });
      sumInputsCapacity += BigInt(cell.output.capacity);
      if (sumInputsCapacity >= needCapacity + changeCapacity + fee) {
        break;
      }
    }
    if (sumInputsCapacity < needCapacity + changeCapacity + fee) {
      throw new InsufficientCKBCapacityError();
    }
    return { inputs, sumInputsCapacity };
  }

  collectUdtInputs({
    liveCells,
    needAmount,
  }: {
    liveCells: IndexerCell[];
    needAmount: bigint;
  }): CollectUdtResult {
    const inputs: CKBComponents.CellInput[] = [];
    let sumInputsCapacity = BigInt(0);
    let sumAmount = BigInt(0);
    for (const cell of liveCells) {
      inputs.push({
        previousOutput: {
          txHash: cell.outPoint.txHash,
          index: cell.outPoint.index,
        },
        since: '0x0',
      });
      sumInputsCapacity = sumInputsCapacity + BigInt(cell.output.capacity);
      sumAmount += leToU128(cell.outputData);
    }
    if (sumAmount < needAmount) {
      throw new InsufficientFreeUDTBalanceError();
    }
    return { inputs, sumInputsCapacity, sumAmount };
  }
}
