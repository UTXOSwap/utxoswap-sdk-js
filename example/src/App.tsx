import { useEffect, useState } from 'react';
import { Button, VStack, Text, Image } from '@chakra-ui/react';
import { ccc } from '@ckb-ccc/connector-react';
import { isMainnet } from './constants';
import Swap from './Swap';
import Create from './Create';

export default function App() {
  /// use CCC connector
  const { wallet, open, setClient } = ccc.useCcc();
  const signer = ccc.useSigner();
  const [internalAddress, setInternalAddress] = useState('');
  const [address, setAddress] = useState('');

  /// effect for ccc signer
  useEffect(() => {
    if (!signer) {
      setInternalAddress('');
      setAddress('');
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
        {address ? <Swap address={address} /> : null}
        {address ? <Create address={address} /> : null}
      </VStack>
    </>
  );
}
