import { useState } from "react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import EditableField from "./components/EditableField";
import { TEXT_OPTIONS, WALLET_OPTIONS } from "./constants/resolver-fields";
import AddField from "./components/AddField";
import {
  useAptosResolverActions,
  useAptosResolverData,
} from "./hooks/aptos-resolver";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { formatAddress } from "./utils/addr";
import Logo from "../public/logo.png";
import { Skeleton } from "antd";

function App() {
  const [count, setCount] = useState(0);
  const domainName = "chomtana.eth";

  const { account } = useWallet();
  const [state, dispatch, fetchData] = useAptosResolverData(domainName);
  const { setAddr, setAddrExt, setText } = useAptosResolverActions(domainName);

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center">
          <div className="flex">
            <img src={Logo} className="w-12 h-12 rounded-full"></img>
          </div>
          <WalletSelector></WalletSelector>
        </div>

        {account ? (
          <>
            <div className="my-5">
              <div className="text-2xl">{domainName}</div>
              <div>Under Aptos Namespace {formatAddress(account.address)}</div>
            </div>

            {state.loading ? (
              <Skeleton active />
            ) : (
              <>
                <div className="my-5">
                  <div className="text-xl mb-2">Wallet Addresses</div>

                  <div className="my-2">
                    <EditableField
                      options={[
                        {
                          value: "637",
                          label: "Aptos",
                        },
                      ]}
                      field="637"
                      value={state.address}
                      onSave={async (_, value) => {
                        try {
                          if (value.startsWith("0x")) {
                            await setAddr(value as `0x${string}`);
                            return true;
                          } else {
                            window.alert("Validation Failed!");
                            return false;
                          }
                        } catch (err) {
                          console.error(err);
                          return false;
                        }
                      }}
                      onDelete={async () => {
                        try {
                          await setAddr(
                            "0x0000000000000000000000000000000000000000000000000000000000000000"
                          );
                          return true;
                        } catch (err) {
                          console.error(err);
                          return false;
                        }
                      }}
                      refreshData={fetchData}
                    ></EditableField>
                  </div>

                  {state.addressExt.map((item) => (
                    <div className="my-2" key={item.field}>
                      <EditableField
                        options={WALLET_OPTIONS}
                        field={item.field}
                        value={item.value}
                        onCancel={async () => true}
                        onSave={async (field, value) => {
                          try {
                            await setAddrExt(parseInt(field), value);
                            return true;
                          } catch (err) {
                            console.error(err);
                            return false;
                          }
                        }}
                        onDelete={async (field) => {
                          try {
                            await setAddrExt(parseInt(field), "");
                            return true;
                          } catch (err) {
                            console.error(err);
                            return false;
                          }
                        }}
                        refreshData={fetchData}
                      ></EditableField>
                    </div>
                  ))}

                  <div className="my-2">
                    <AddField
                      options={WALLET_OPTIONS}
                      onCancel={async () => true}
                      onSave={async (field, value) => {
                        try {
                          await setAddrExt(parseInt(field), value);
                          return true;
                        } catch (err) {
                          console.error(err);
                          return false;
                        }
                      }}
                      refreshData={fetchData}
                    ></AddField>
                  </div>
                </div>

                <div className="my-5">
                  <div className="text-xl mb-2">Text & Social</div>

                  {state.text.map((item) => (
                    <div className="my-2" key={item.field}>
                      <EditableField
                        options={TEXT_OPTIONS}
                        field={item.field}
                        value={item.value}
                        onCancel={async () => true}
                        onSave={async (field, value) => {
                          try {
                            await setText(field, value);
                            return true;
                          } catch (err) {
                            console.error(err);
                            return false;
                          }
                        }}
                        onDelete={async (field) => {
                          try {
                            await setText(field, "");
                            return true;
                          } catch (err) {
                            console.error(err);
                            return false;
                          }
                        }}
                        refreshData={fetchData}
                      ></EditableField>
                    </div>
                  ))}

                  <div className="my-2">
                    <AddField
                      options={TEXT_OPTIONS}
                      onCancel={async () => true}
                      onSave={async (field, value) => {
                        try {
                          await setText(field, value);
                          return true;
                        } catch (err) {
                          console.error(err);
                          return false;
                        }
                      }}
                      refreshData={fetchData}
                    ></AddField>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col justify-center items-center my-12">
            <div className="text-lg mb-2">
              Please Connect your Wallet
            </div>

            <div>
              <WalletSelector></WalletSelector>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
