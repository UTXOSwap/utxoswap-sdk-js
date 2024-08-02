import React from 'react';
import ReactDOM from 'react-dom/client';
import GitHubCorners from '@uiw/react-github-corners';
import { ChakraProvider } from '@chakra-ui/react';
import { ccc } from '@ckb-ccc/connector-react';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <ccc.Provider>
        <App />
        <GitHubCorners
          position="right"
          size={120}
          href="https://github.com/UTXOSwap/utxoswap-sdk-js"
        />
      </ccc.Provider>
    </ChakraProvider>
  </React.StrictMode>
);
