import invariant from 'tiny-invariant';
import { PoolInfo, SignTransactionFunc, Token } from '../types';
import { Collector } from './collector';
import {
  calculateOutputAndPriceImpactWithExactInput,
  exactInputForOutput,
} from '../utils';
import { Client } from './client';

export class Pool {
  private ckbAddress: string;
  private collector: Collector;
  private client: Client;
  private poolInfo: PoolInfo;
  public tokens: [Token, Token];

  public constructor({
    tokens,
    ckbAddress,
    collector,
    client,
    poolInfo,
  }: {
    tokens: [Token, Token];
    ckbAddress: string;
    collector: Collector;
    client: Client;
    poolInfo: PoolInfo;
  }) {
    invariant(tokens.length === 2, "Expect tokens's length equal to 2.");
    this.tokens = tokens;
    this.ckbAddress = ckbAddress;
    this.collector = collector;
    this.client = client;
    this.poolInfo = poolInfo;
  }

  public calculateOutputAmountAndPriceImpactWithExactInput(
    inputAmount: string
  ) {
    invariant(this.tokens.length === 2, "Expect tokens's length equal to 2.");
    invariant(this.poolInfo, 'Init pool info first or pool not created.');

    const tokens = [{ ...this.tokens[0], amount: inputAmount }, this.tokens[1]];
    const {
      output,
      priceImpact,
      buyPrice,
    } = calculateOutputAndPriceImpactWithExactInput(tokens, this.poolInfo);

    this.tokens = [tokens[0], { ...tokens[1], amount: output }];

    return { output, priceImpact, buyPrice };
  }

  public async swapWithExactInput(
    signTxFunc: SignTransactionFunc,
    slippage = '0.5',
    feeRate = 5000
  ) {
    invariant(this.tokens.length === 2, "Expect tokens's length equal to 2.");
    invariant(this.poolInfo, 'Init pool info first or pool not created.');
    invariant(
      this.tokens[0].amount && this.tokens[1].amount,
      'Please enter the amount of tokens.'
    );
    invariant(feeRate >= 5000, 'Fee rate must equal to or bigger than 5000.');

    const intentTxHash = await exactInputForOutput(
      slippage,
      BigInt(feeRate),
      this.ckbAddress,
      this.tokens,
      this.poolInfo,
      this.collector,
      this.client,
      signTxFunc
    );

    return intentTxHash;
  }
}
