import { useState } from 'react';
import {
  Divider,
  HStack,
  InputLeftAddon,
  InputGroup,
  Text,
  VStack,
  Input,
  Button,
  useToast,
  Select,
} from '@chakra-ui/react';
import { Pool } from '@utxoswap/swap-sdk-js';
import { CKB, client, collector, tBTC } from './constants';
import { transactionFormatter } from './utils';
import { ccc, TransactionLike } from '@ckb-ccc/connector-react';

export default function Create({ address }: { address: string }) {
  const toast = useToast();
  const signer = ccc.useSigner();

  const [tokenXSymbol, setTokenXSymbol] = useState(CKB.symbol);
  const [tokenXAmount, setTokenXAmount] = useState('');

  const [tokenYAmount, setTokenYAmount] = useState('');
  const [tokenYTypeHash, setTokenYTypeHash] = useState('');

  const [intentHash, setIntentHash] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const signTxFunc = async (rawTx: CKBComponents.RawTransactionToSign) => {
    const txLike = await signer!.signTransaction(rawTx as TransactionLike);

    return transactionFormatter(txLike);
  };

  const handleCreatePool = async () => {
    if (!tokenXSymbol || !tokenYAmount || !tokenYTypeHash) {
      toast({
        title: 'Error',
        status: 'error',
        description: 'Please fill in all fields',
      });
      return;
    }
    try {
      setCreateLoading(true);

      const { list } = await client.getTokenByTypeHash(tokenYTypeHash);

      if (list.length === 0) {
        toast({
          title: 'Error',
          status: 'error',
          description:
            'Token Y not found, please check the type hash or try again',
        });
        return;
      }

      const tokenX = tokenXSymbol === CKB.symbol ? CKB : tBTC;
      const tokenY = list[0];

      const pool = new Pool({
        tokens: [
          {
            ...tokenX,
            amount: tokenXAmount,
          },
          {
            ...tokenY,
            amount: tokenYAmount,
          },
        ],
        ckbAddress: address,
        collector,
        client,
      });
      const txHash = await pool.createPool(signTxFunc);
      setIntentHash(txHash);
    } catch (error) {
      console.error(error);

      toast({
        title: 'Error',
        status: 'error',
        description: (error as any)?.message ?? 'unknown error',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      <Divider my="10px" />
      <Text fontSize="30px" fontWeight="bold">
        Create Pool
      </Text>

      <HStack justify="center" w="full">
        <VStack w="40%">
          <Text>Token X</Text>
          <Select
            value={tokenXSymbol}
            onChange={e => setTokenXSymbol(e.target.value)}
          >
            <option value="option1">CKB</option>
            <option value="option2">tBTC</option>
          </Select>
          <InputGroup>
            <InputLeftAddon w="100px">Amount</InputLeftAddon>
            <Input
              type="text"
              value={tokenXAmount}
              onChange={e => setTokenXAmount(e.target.value)}
              placeholder="Amount"
            />
          </InputGroup>
        </VStack>
        <Text mx="40px">+</Text>
        <VStack w="40%">
          <Text>Token Y</Text>
          <InputGroup>
            <InputLeftAddon w="100px">TypeHash</InputLeftAddon>
            <Input
              type="text"
              value={tokenYTypeHash}
              onChange={e => setTokenYTypeHash(e.target.value)}
              placeholder="TypeHash"
            />
          </InputGroup>
          <InputGroup>
            <InputLeftAddon w="100px">Amount</InputLeftAddon>
            <Input
              type="number"
              value={tokenYAmount}
              onChange={e => setTokenYAmount(e.target.value)}
              placeholder="Amount"
            />
          </InputGroup>
        </VStack>
      </HStack>

      <Button
        onClick={handleCreatePool}
        colorScheme="blue"
        isLoading={createLoading}
      >
        Create Pool
      </Button>
      <Text>Intent Tx Hash: {intentHash || '--'}</Text>
    </>
  );
}
