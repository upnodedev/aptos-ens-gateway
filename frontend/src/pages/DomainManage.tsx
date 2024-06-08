import EditableField from "../components/EditableField";
import { TEXT_OPTIONS, WALLET_OPTIONS } from "../constants/resolver-fields";
import AddField from "../components/AddField";
import {
  useAptosResolverActions,
  useAptosResolverData,
} from "../hooks/useAptosResolver";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button, Skeleton } from "antd";
import { useParams } from "react-router-dom";
import { useEnsDomain } from "../hooks/useEnsDomains";
import DomainENS from "../components/DomainENS";
import { useChainId, usePublicClient, useWriteContract } from "wagmi";
import { useCallback } from "react";
import { namehash } from "viem";
import { normalize } from "viem/ens";
import NameWrapper from '../abi/NameWrapper.json'
import TOR from '../abi/TOR.json'
import { useAptosDomain } from "../hooks/useAptosDomains";
import { NAMEWRAPPER_CONTRACT, RESOLVER_CONTRACT } from "../constants/ens-address";

function DomainManage() {
  const { domainName: domainName_ } = useParams() as { domainName: string };
  const domainName = normalize(domainName_)

  const { account } = useWallet();
  const [state, _, fetchData] = useAptosResolverData(domainName);
  const { setAddr, setAddrExt, setText } = useAptosResolverActions(domainName);
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const chainId = useChainId()

  const [ ensDomain, domainLoading, refreshDomain ] = useEnsDomain(domainName)
  const [ aptosDomain, aptosDomainLoading, __ ] = useAptosDomain(domainName)
  const domain = ensDomain || aptosDomain

  console.log('LOADING', state.loading)

  const linkToAptos = useCallback(async () => {
    if (domainName && account?.address && publicClient) {
      const promises: Promise<any>[] = []

      if (domain?.resolver.toLowerCase() != RESOLVER_CONTRACT[chainId].toLowerCase()) {
        const hash1 = await writeContractAsync({
          address: domain?.isWrapped ? NAMEWRAPPER_CONTRACT[chainId] : '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          abi: NameWrapper,
          functionName: 'setResolver',
          args: [namehash(domainName), RESOLVER_CONTRACT[chainId]],
        })

        promises.push(publicClient.waitForTransactionReceipt({ hash: hash1 }))
      }

      const hash2 = await writeContractAsync({
        address: RESOLVER_CONTRACT[chainId],
        abi: TOR,
        functionName: 'setText',
        args: [namehash(domainName), 'ccip.context', `0xA910501242cfd5f90a9dbEfD1e7923592Ab5E2d1 https://aptos-ens-gw.chom.dev/${chainId == 1 ? 'm' : 's'}/${account.address}`],
      })

      promises.push(publicClient.waitForTransactionReceipt({ hash: hash2 }))

      await Promise.all(promises)

      refreshDomain()
    }
  }, [ domain, domainName, account?.address, publicClient ])

  if (!domainLoading && !aptosDomainLoading && !domain) {
    window.alert(`Domain ${domainName} is not found!`)
    window.location.href = '/'

    return <div></div>
  }
  if (!account) return <div></div>;

  return (
    <>
      <div>
        {/* <div className="my-5">
          <div className="text-2xl">{domainName}</div>
          <div>Under Aptos Namespace {formatAddress(account.address)}</div>
        </div> */}

        {state.loading || domainLoading || aptosDomainLoading || !domain ? (
          <Skeleton active className="mt-8" />
        ) : (
          <>
            <div className="my-5 flex justify-between items-center">
              <DomainENS domain={domain}></DomainENS>

              {!domain.isApt &&
                <div>
                  <Button type="primary" size="large" onClick={() => linkToAptos()}>
                    Link to Aptos
                  </Button>
                </div>
              }
            </div>

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
                  value={domain.isApt ? domain.owner : state.address}
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
      </div>
    </>
  );
}

export default DomainManage;
