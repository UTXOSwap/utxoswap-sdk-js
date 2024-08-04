import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  VStack,
  Text,
  Input,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Image,
} from '@chakra-ui/react';
import { ccc } from '@ckb-ccc/connector-react';
import {
  Collector,
  Token,
  Client,
  Pool,
  SWAP_OCCUPIED_CKB_AMOUNT,
  PoolInfo,
} from '@utxoswap/swap-sdk-js';
import {
  formatBigIntWithDecimal,
  getTokenBalance,
  transactionFormatter,
} from './utils';
import { TransactionLike } from '@ckb-ccc/core';

const isMainnet = false;
const ckbIndexerUrl = 'https://testnet.ckbapp.dev';
const testApiKey = 'cYztRDvbH9sDaH2HV2Ut4TpIioYVyG07pUz46Dz1';

const ckb = {
  decimals: 8,
  name: 'CKB',
  symbol: 'CKB',
  typeHash:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
};

/// for CKB on chain query
const collector = new Collector({ ckbIndexerUrl });

/// for utxo swap backend service
const client = new Client(isMainnet, testApiKey);

export default function App() {
  const toast = useToast();
  /// use CCC connector
  const { wallet, open, setClient } = ccc.useCcc();
  const signer = ccc.useSigner();
  const [internalAddress, setInternalAddress] = useState('');
  const [address, setAddress] = useState('');

  /// tokens info
  const [tokens, setTokens] = useState<Array<Token>>([]);
  const [poolsWithCkb, setPoolsWithCkb] = useState<Array<PoolInfo>>([]);

  /// ckb balance
  const [ckbBalance, setCKBBalance] = useState(BigInt(0));

  const pool = useRef<Pool | undefined>();
  const [inputValue, setInputValue] = useState('');
  const [intentHash, setIntentHash] = useState('');

  /// effect for ccc signer
  useEffect(() => {
    if (!signer) {
      setInternalAddress('');
      setAddress('');
      setCKBBalance(BigInt(0));
      setIntentHash('');
      return;
    }

    (async () => {
      setInternalAddress(await signer.getInternalAddress());
      setAddress(await signer.getRecommendedAddress());
    })();
  }, [signer]);

  useEffect(() => {
    setClient(
      isMainnet ? new ccc.ClientPublicMainnet() : new ccc.ClientPublicTestnet()
    );
  }, [setClient]);

  useEffect(() => {
    if (!address) {
      return;
    }

    (async () => {
      const { list: pools } = await client.getPoolsByToken({
        pageNo: 0,
        pageSize: 10,
        searchKey: ckb.typeHash,
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
    }
  };

  return (
    <>
      <VStack>
        <Text fontSize="32px" mt="40px">
          UTXOSwap SDK Demo
        </Text>
        {wallet ? (
          <>
            <Image src={wallet.icon} alt={wallet.name} w="60px" h="60px" />
            <Text>{internalAddress}</Text>
            <Text>{address}</Text>
            <Button onClick={open}>
              {internalAddress.slice(0, 7)}...{internalAddress.slice(-5)}
            </Button>
          </>
        ) : (
          <Button onClick={open}>Connect Wallet</Button>
        )}
        {address ? (
          <>
            <Text>
              CKB Balance: {formatBigIntWithDecimal(ckbBalance, ckb.decimals)}
            </Text>

            <Menu>
              <MenuButton as={Button}>
                Select a pool you want to swap
              </MenuButton>
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
                <Divider my="10px" />
                <Text fontSize="20px">
                  {tokens[0]?.symbol} to {tokens[1]?.symbol}:
                </Text>
                <Text fontSize="14px">
                  Available CKB Amount:{' '}
                  {formatBigIntWithDecimal(ckbAvailableBalance, ckb.decimals)}
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
                <Button onClick={swapCKBToTBtc} colorScheme="blue">
                  Swap CKB to tBtc
                </Button>
                <Text>Intent Tx Hash: {intentHash || '--'}</Text>
              </>
            ) : null}
          </>
        ) : null}
      </VStack>
    </>
  );
}
