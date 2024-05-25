import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Logo from "../public/logo.png";
import { useAccount } from "wagmi";
import { Link, Outlet } from "react-router-dom";

function App() {
  const { address } = useAccount()
  const { account } = useWallet();

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center">
          <Link to="/">
            <div className="flex flex-shrink-0">
              <img src={Logo} className="w-12 h-12 rounded-full"></img>
            </div>
          </Link>

          <div className="flex items-center">
            <div style={{ maxWidth: '40vw' }}>
              <w3m-button balance="hide" />
            </div>

            <div className="ml-2">
              <WalletSelector></WalletSelector>
            </div>
          </div>
        </div>

        {account && address ? <Outlet></Outlet> : (
          <div className="flex flex-col justify-center items-center my-12">
            <div className="text-lg mb-2">
              Please Connect your Wallet
            </div>

            <div>
              <div className="mb-1 text-center">Aptos Wallet</div>
              <WalletSelector></WalletSelector>
            </div>

            <div className="my-4">
              --- AND ---
            </div>

            <div>
              <div className="mb-1 text-center">EVM Wallet</div>
              <w3m-button />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
