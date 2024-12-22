import {
  append0x,
  calculateTransactionFee,
  getSecp256k1CellDep,
  getUniqueTypeDep,
  getXudtDep,
} from '@rgbpp-sdk/ckb';
import { getTransactionSize } from '@nervosnetwork/ckb-sdk-utils';

export const getCCBTCCellDeps = (isMainnet: boolean): CKBComponents.CellDep => {
  return isMainnet
    ? {
        outPoint: {
          txHash:
            '0x3ceb520f240b168e0bddf0d89b4bcabbe7d4fa69751057cbe8e4f27239fad0e9',
          index: '0x0',
        },
        depType: 'code',
      }
    : {
        outPoint: {
          txHash:
            '0x877c4c3c6f7159f29ea711f0cd21a54f93dcf950642c6a3a5abc9c070051372e',
          index: '0x0',
        },
        depType: 'code',
      };
};

export const getJoyIDCellDep = (isMainnet: boolean): CKBComponents.CellDep =>
  isMainnet
    ? {
        outPoint: {
          txHash:
            '0xf05188e5f3a6767fc4687faf45ba5f1a6e25d3ada6129dae8722cb282f262493',
          index: '0x0',
        },
        depType: 'depGroup',
      }
    : {
        outPoint: {
          txHash:
            '0x4dcf3f3b09efac8995d6cbee87c5345e812d310094651e0c3d9a730f32dc9263',
          index: '0x0',
        },
        depType: 'depGroup',
      };

export const getRUSDCellDeps = (isMainnet: boolean): CKBComponents.CellDep => {
  return isMainnet
    ? {
        outPoint: {
          txHash:
            '0x8ec1081bd03e5417bb4467e96f4cec841acdd35924538a35e7547fe320118977',
          index: '0x0',
        },
        depType: 'code',
      }
    : {
        outPoint: {
          txHash:
            '0xed7d65b9ad3d99657e37c4285d585fea8a5fcaf58165d54dacf90243f911548b',
          index: '0x0',
        },
        depType: 'code',
      };
};

export const getUSDICellDeps = (isMainnet: boolean): CKBComponents.CellDep => {
  return isMainnet
    ? {
        outPoint: {
          txHash:
            '0xf6a5eef65101899db9709c8de1cc28f23c1bee90d857ebe176f6647ef109e20d',
          index: '0x0',
        },
        depType: 'code',
      }
    : {
        outPoint: {
          txHash:
            '0x03d029480416c2fc927dfbfe0ed1916ffaf55d1e1f3146c55cf2d3dd5e674e61',
          index: '0x0',
        },
        depType: 'code',
      };
};

export const appendCellDepsAndWitnessToUnsignedTx = (
  unsignedTx: CKBComponents.RawTransactionToSign,
  changeCapacity: bigint,
  feeRate: bigint,
  isMainnet: boolean
): CKBComponents.RawTransactionToSign => {
  const cellDeps: CKBComponents.CellDep[] = [
    getUniqueTypeDep(isMainnet),
    getSecp256k1CellDep(isMainnet),
    getXudtDep(isMainnet),
    getCCBTCCellDeps(isMainnet),
    getJoyIDCellDep(isMainnet),
    getRUSDCellDeps(isMainnet),
    getUSDICellDeps(isMainnet),
  ];

  const witnesses: (
    | CKBComponents.WitnessArgs
    | CKBComponents.Witness
  )[] = unsignedTx.inputs.map(() => '0x');

  const unsignedTxWithCellDepsAndWitness = {
    ...unsignedTx,
    cellDeps,
    witnesses,
  };

  const txSize = getTransactionSize(unsignedTxWithCellDepsAndWitness) + 255;

  const estimatedTxFee = calculateTransactionFee(txSize, feeRate);

  changeCapacity -= estimatedTxFee;
  unsignedTxWithCellDepsAndWitness.outputs[
    unsignedTxWithCellDepsAndWitness.outputs.length - 1
  ].capacity = append0x(changeCapacity.toString(16));

  return unsignedTxWithCellDepsAndWitness;
};
