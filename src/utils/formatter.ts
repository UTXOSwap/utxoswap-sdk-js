import BigNumber from 'bignumber.js';
import { Token } from '../types';

export const bigNumberToBigInt = (
  value: BigNumber.Value = 0,
  decimals: number
) => {
  const a = new BigNumber(value)
    .multipliedBy(10 ** decimals)
    .toFixed(0, BigNumber.ROUND_FLOOR);

  return BigInt(a);
};

export function getTokenUnits(
  amount?: BigNumber.Value,
  decimal: number = 8
): string {
  if (!amount) return '0';
  const tokenAmount = new BigNumber(amount);
  const actualAmount = tokenAmount.dividedBy(new BigNumber(10).pow(decimal));

  return actualAmount.toFixed(decimal).replace(/\.?0+$/, '');
}

export const swapTokens = (tokens: Token[]) => {
  /// [XUDT, CKB] -> [CKB, XUDT]
  const [tokenX, tokenY] = tokens;

  if (tokenX.typeHash > tokenY.typeHash) {
    return [tokenY, tokenX];
  }

  return tokens;
};
