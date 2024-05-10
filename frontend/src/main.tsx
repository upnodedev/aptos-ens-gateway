import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import './index.css'
import AptosWalletProvider from './components/AptosWalletProvider.tsx';
import { DomainResolverProvider } from './reducers/DomainResolverReducer.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AptosWalletProvider>
      <DomainResolverProvider>
        <App />
      </DomainResolverProvider>
    </AptosWalletProvider>
  </React.StrictMode>,
)
