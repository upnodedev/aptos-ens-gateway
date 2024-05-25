import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import './index.css'
import AptosWalletProvider from './components/AptosWalletProvider.tsx';
import { DomainResolverProvider } from './reducers/DomainResolverReducer.tsx';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import DomainManage from './pages/DomainManage.tsx';
import DomainList from './pages/DomainList.tsx';
import { Web3ModalProvider } from './components/Web3ModalProvider.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App></App>,
    children: [
      {
        path: "/",
        element: <DomainList></DomainList>
      },
      {
        path: "/:domainName",
        element: <DomainManage></DomainManage>,
      },      
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Web3ModalProvider>
      <AptosWalletProvider>
        <DomainResolverProvider>
          <RouterProvider router={router} />
        </DomainResolverProvider>
      </AptosWalletProvider>
    </Web3ModalProvider>
  </React.StrictMode>,
)
