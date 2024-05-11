import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { DomainResolverState, useDomainResolverReducer } from "../reducers/DomainResolverReducer.tsx";
import { useCallback, useEffect } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import RESOLVER_ABI from '../abi/ResolverABI.ts';
import packet from 'dns-packet'
import { useWalletClient } from "@thalalabs/surf/hooks";

function hexEncodeName(name: string) {
  return (packet as any).name.encode(name) as Buffer
}

const aptos = new Aptos(
  new AptosConfig({ network: Network.TESTNET })
)
const client = createSurfClient(aptos);

export function useAptosResolverData(domainName: string): [
  DomainResolverState,
  React.Dispatch<any>,
  () => Promise<void>,
] {
  const { account } = useWallet();
  const [ state, dispatch ] = useDomainResolverReducer()
  const dnsNode = hexEncodeName(domainName)

  const fetchData = useCallback(async () => {
    if (account && domainName) {
      const [hasResolver] = await client.useABI(RESOLVER_ABI).view.has_resolver({
        functionArguments: [account.address as `0x${string}`, [...dnsNode]],
        typeArguments: [],
      });
  
      console.log('Has Resolver', hasResolver)

      if (hasResolver) {

      }
    } else {
      dispatch({
        type: 'RESET',
      })
    }
  }, [ domainName, account, dispatch ])

  useEffect(() => {
    fetchData();
  }, [ domainName, account, dispatch ])

  return [ state, dispatch, fetchData ]
}

export function useAptosResolverActions(domainName: string) {
  const { client } = useWalletClient();
  const dnsNode = hexEncodeName(domainName)

  const setAddr = useCallback(async (address: `0x${string}`) => {
    if (client) {
      const { hash } = await client.useABI(RESOLVER_ABI).set_addr({
        arguments: [[...dnsNode], address],
        type_arguments: [],
      });

      await aptos.waitForTransaction({ transactionHash: hash })
      return hash
    }
  }, [ client ])

  const setAddrExt = useCallback(async (coinType: number, address: string) => {
    if (client) {
      // address is hex
      if (address.startsWith('0x')) {
        const hexArray = [];
        for (let i = 2; i < address.length; i += 2) {
            hexArray.push(parseInt(address.substring(i, i + 2), 16));
        }

        const { hash } = await client.useABI(RESOLVER_ABI).set_addr_ext({
          arguments: [[...dnsNode], coinType, hexArray],
          type_arguments: [],
        });
  
        await aptos.waitForTransaction({ transactionHash: hash })
        return hash
      } else {
        const { hash } = await client.useABI(RESOLVER_ABI).set_addr_ext({
          arguments: [[...dnsNode], coinType, address],
          type_arguments: [],
        });
  
        await aptos.waitForTransaction({ transactionHash: hash })
        return hash
      }
    }
  }, [ client ])

  const setText = useCallback(async (field: string, value: string) => {
    if (client) {
      const { hash } = await client.useABI(RESOLVER_ABI).set_text({
        arguments: [[...dnsNode], field, value],
        type_arguments: [],
      });

      await aptos.waitForTransaction({ transactionHash: hash })
      return hash
    }
  }, [ client ])

  const setContentHash = useCallback(async (contenthash: string) => {
    if (client) {
      const { hash } = await client.useABI(RESOLVER_ABI).set_contenthash({
        arguments: [[...dnsNode], contenthash],
        type_arguments: [],
      });

      await aptos.waitForTransaction({ transactionHash: hash })
      return hash
    }
  }, [ client ])

  return {
    setAddr,
    setAddrExt,
    setText,
    setContentHash,
  }
}