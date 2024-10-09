import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { Pool } from '@utxoswap/swap-sdk-js';
import { ckb, client, collector, isMainnet } from './constants';
import { transactionFormatter } from './utils';
import { ccc, TransactionLike } from '@ckb-ccc/connector-react';
import { getXudtTypeScript } from '@rgbpp-sdk/ckb';

export default function Create({ address }: { address: string }) {
  const toast = useToast();
  const signer = ccc.useSigner();

  const [tokenXSymbol, setTokenXSymbol] = useState(ckb.symbol);
  const [tokenXAmount, setTokenXAmount] = useState('');
  const [tokenXDecimals, setTokenXDecimals] = useState(`${ckb.decimals}`);
  const [tokenXArgs, setTokenXArgs] = useState('');
  const [tokenXTypeHash, setTokenXTypeHash] = useState(ckb.typeHash);

  const [tokenYSymbol, setTokenYSymbol] = useState('');
  const [tokenYAmount, setTokenYAmount] = useState('');
  const [tokenYDecimals, setTokenYDecimals] = useState('');
  const [tokenYArgs, setTokenYArgs] = useState('');
  const [tokenYTypeHash, setTokenYTypeHash] = useState('');

  const [intentHash, setIntentHash] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const signTxFunc = async (rawTx: CKBComponents.RawTransactionToSign) => {
    const txLike = await signer!.signTransaction(rawTx as TransactionLike);

    return transactionFormatter(txLike);
  };

  const handleCreatePool = async () => {
    if (
      !tokenXSymbol ||
      !tokenXAmount ||
      !tokenXDecimals ||
      !tokenXTypeHash ||
      !tokenYSymbol ||
      !tokenYAmount ||
      !tokenYDecimals ||
      !tokenYTypeHash
    ) {
      toast({
        title: 'Error',
        status: 'error',
        description: 'Please fill in all fields',
      });
      return;
    }
    try {
      setCreateLoading(true);
      const tokenXTypeScript: CKBComponents.Script = {
        ...getXudtTypeScript(isMainnet),
        args: tokenXArgs,
      };
      const tokenYTypeScript: CKBComponents.Script = {
        ...getXudtTypeScript(isMainnet),
        args: tokenYArgs,
      };
      const pool = new Pool({
        tokens: [
          {
            symbol: tokenXSymbol,
            amount: tokenXAmount,
            decimals: parseInt(tokenXDecimals),
            typeHash: tokenXTypeHash,
            typeScript:
              tokenXTypeHash === ckb.typeHash ? undefined : tokenXTypeScript,
          },
          {
            symbol: tokenYSymbol,
            amount: tokenYAmount,
            decimals: parseInt(tokenYDecimals),
            typeHash: tokenYTypeHash,
            typeScript:
              tokenYTypeHash === ckb.typeHash ? undefined : tokenYTypeScript,
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

      <HStack justify="space-between" w="full" px="100px">
        <VStack w="40%">
          <Text>Token X</Text>
          <InputGroup>
            <InputLeftAddon w="100px">Symbol</InputLeftAddon>
            <Input
              type="text"
              value={tokenXSymbol}
              onChange={e => setTokenXSymbol(e.target.value)}
              placeholder="Symbol"
            />
          </InputGroup>
          <InputGroup>
            <InputLeftAddon w="100px">Amount</InputLeftAddon>
            <Input
              type="number"
              value={tokenXAmount}
              onChange={e => setTokenXAmount(e.target.value)}
              placeholder="Amount"
            />
          </InputGroup>
          <InputGroup>
            <InputLeftAddon w="100px">Decimals</InputLeftAddon>
            <Input
              type="number"
              value={tokenXDecimals}
              onChange={e => setTokenXDecimals(e.target.value)}
              placeholder="Decimals"
            />
          </InputGroup>
          <InputGroup>
            <InputLeftAddon w="100px">TypeHash</InputLeftAddon>
            <Input
              type="text"
              value={tokenXTypeHash}
              onChange={e => setTokenXTypeHash(e.target.value)}
              placeholder="TypeHash"
            />
          </InputGroup>
          <InputGroup>
            <InputLeftAddon w="100px">Args</InputLeftAddon>
            <Input
              type="text"
              value={tokenXArgs}
              onChange={e => setTokenXArgs(e.target.value)}
              placeholder="Args (Unnecessary if token is ckb)"
            />
          </InputGroup>
        </VStack>
        <Text>{'<-->'}</Text>
        <VStack w="40%">
          <Text>Token Y</Text>
          <InputGroup>
            <InputLeftAddon w="100px">Symbol</InputLeftAddon>
            <Input
              type="text"
              value={tokenYSymbol}
              onChange={e => setTokenYSymbol(e.target.value)}
              placeholder="Symbol"
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
          <InputGroup>
            <InputLeftAddon w="100px">Decimals</InputLeftAddon>
            <Input
              type="number"
              value={tokenYDecimals}
              onChange={e => setTokenYDecimals(e.target.value)}
              placeholder="Decimals"
            />
          </InputGroup>
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
            <InputLeftAddon w="100px">Args</InputLeftAddon>
            <Input
              type="text"
              value={tokenYArgs}
              onChange={e => setTokenYArgs(e.target.value)}
              placeholder="Args (Unnecessary if token is ckb)"
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
