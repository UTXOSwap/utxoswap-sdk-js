import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Text,
  Input,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from '@chakra-ui/react';
import { ccc, TransactionLike } from '@ckb-ccc/connector-react';
import {
  Token,
  Pool,
  SWAP_OCCUPIED_CKB_AMOUNT,
  PoolInfo,
} from '@utxoswap/swap-sdk-js';
import {
  formatBigIntWithDecimal,
  getTokenBalance,
  transactionFormatter,
} from './utils';
import { CKB, client, collector } from './constants';

export default function Swap({ address }: { address: string }) {
  const toast = useToast();
  const signer = ccc.useSigner();

  /// ckb balance
  const [ckbBalance, setCKBBalance] = useState(BigInt(0));

  const pool = useRef<Pool | undefined>();
  const [inputValue, setInputValue] = useState('');
  const [intentHash, setIntentHash] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);

  /// tokens info
  const [tokens, setTokens] = useState<Array<Token>>([]);
  const [poolsWithCkb, setPoolsWithCkb] = useState<Array<PoolInfo>>([]);

  useEffect(() => {
    if (!address) {
      return;
    }

    (async () => {
      const { list: pools } = await client.getPoolsByToken({
        pageNo: 0,
        pageSize: 10,
        searchKey: CKB.typeHash,
      });

      setPoolsWithCkb(pools);

      const _ckbBalance = await getTokenBalance(collector, address);

      setCKBBalance(_ckbBalance);
    })();
  }, [address]);

  /// effect for calculate output
  useEffect(() => {
    if (pool.current && inputValue) {
      const {
        output,
      } = pool.current.calculateOutputAmountAndPriceImpactWithExactInput(
        inputValue
      );

      setTokens(tokens => {
        if (tokens.length === 2) {
          return [
            { ...tokens[0], amount: inputValue },
            { ...tokens[1], amount: output },
          ];
        }

        return tokens;
      });
    } else {
      setTokens(tokens => {
        if (tokens.length === 2) {
          return [
            { ...tokens[0], amount: inputValue },
            { ...tokens[1], amount: '0' },
          ];
        }
        return tokens;
      });
    }
  }, [inputValue, pool.current]);

  const ckbAvailableBalance = useMemo(() => {
    return ckbBalance - SWAP_OCCUPIED_CKB_AMOUNT >= 0
      ? ckbBalance - SWAP_OCCUPIED_CKB_AMOUNT
      : BigInt(0);
  }, [ckbBalance]);

  const handlePoolSelected = (poolInfo: PoolInfo) => {
    const tokens: [Token, Token] = [poolInfo.assetX, poolInfo.assetY];
    setTokens(tokens);
    setInputValue('');
    setIntentHash('');
    pool.current = new Pool({
      tokens,
      ckbAddress: address,
      collector,
      client,
      poolInfo,
    });
  };

  const signTxFunc = async (rawTx: CKBComponents.RawTransactionToSign) => {
    const txLike = await signer!.signTransaction(rawTx as TransactionLike);

    return transactionFormatter(txLike);
  };

  const swapCKBToTBtc = async () => {
    if (!signer) return;
    const slippage = '0.5';
    try {
      setSwapLoading(true);
      const intentTxHash = await pool.current!.swapWithExactInput(
        signTxFunc,
        slippage,
        5000
      );
      setIntentHash(intentTxHash ?? '');
    } catch (e) {
      toast({
        title: 'Error',
        status: 'error',
        description: (e as any)?.message ?? 'unknown error',
      });
    } finally {
      setSwapLoading(false);
    }
  };

  return (
    <>
      <Divider my="10px" />
      <Text fontSize="30px" fontWeight="bold">
        Swap
      </Text>

      <Text>
        CKB Balance: {formatBigIntWithDecimal(ckbBalance, CKB.decimals)}
      </Text>

      <Menu>
        <MenuButton as={Button}>Select a pool you want to swap</MenuButton>
        <MenuList>
          {poolsWithCkb.map(pool => {
            return (
              <MenuItem
                key={pool.typeHash}
                onClick={() => handlePoolSelected(pool)}
              >
                {pool.assetX.symbol} {'<-->'} {pool.assetY.symbol}
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
      {tokens.length === 2 ? (
        <>
          <Text fontSize="20px">
            {tokens[0]?.symbol} to {tokens[1]?.symbol}:
          </Text>
          <Text fontSize="14px">
            Available CKB Amount:{' '}
            {formatBigIntWithDecimal(ckbAvailableBalance, CKB.decimals)}
          </Text>
          <Input
            w="40%"
            type="number"
            placeholder="Enter CKB amount"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          ></Input>
          <Text>
            You get {tokens[1]?.symbol}: {tokens[1].amount}
          </Text>
          <Button
            onClick={swapCKBToTBtc}
            colorScheme="blue"
            isLoading={swapLoading}
          >
            Swap CKB to tBtc
          </Button>
          <Text>Intent Tx Hash: {intentHash || '--'}</Text>
        </>
      ) : null}
    </>
  );
}
