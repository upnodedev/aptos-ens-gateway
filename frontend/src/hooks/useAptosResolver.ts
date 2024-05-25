import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  DomainResolverState,
  useDomainResolverReducer,
} from "../reducers/DomainResolverReducer.tsx";
import { useCallback, useEffect } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import RESOLVER_ABI from "../abi/ResolverABI.ts";
import packet from "dns-packet";
import { useWalletClient } from "@thalalabs/surf/hooks";
import { TEXT_OPTIONS, WALLET_OPTIONS } from "../constants/resolver-fields.ts";
import { Buffer } from 'buffer'

function hexEncodeName(name: string) {
  return (packet as any).name.encode(name) as Buffer;
}

function convertToNumberArray(input: string | number[]) {
  // Check if input is a string and starts with '0x', indicating a hex string
  if (typeof input === 'string' && input.startsWith('0x')) {
      // Convert hex string to an array of numbers
      // Each pair of hex digits is converted to a number
      let numbers = [];
      for (let i = 2; i < input.length; i += 2) {
          numbers.push(parseInt(input.substr(i, 2), 16));
      }
      return numbers;
  }
  // Check if input is an array of numbers
  else if (Array.isArray(input) && input.every(item => typeof item === 'number')) {
      // Return the array as is
      return input;
  }
  // Handle invalid input types
  throw new Error("Input must be a hex string starting with '0x' or an array of numbers.");
}

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
const client = createSurfClient(aptos);

export function useAptosResolverData(
  domainName: string
): [DomainResolverState, React.Dispatch<any>, () => Promise<void>] {
  const { account } = useWallet();
  const [state, dispatch] = useDomainResolverReducer();
  const dnsNode = hexEncodeName(domainName);

  const fetchData = useCallback(async () => {
    dispatch({
      type: "RESET",
    });

    if (account && domainName) {
      const [hasResolver] = await client
        .useABI(RESOLVER_ABI)
        .view.has_resolver({
          functionArguments: [account.address as `0x${string}`, [...dnsNode]],
          typeArguments: [],
        });

      console.log("Has Resolver", hasResolver);

      if (hasResolver) {
        const [walletAptos] = await client.useABI(RESOLVER_ABI).view.get_addr({
          functionArguments: [account.address as `0x${string}`, [...dnsNode]],
          typeArguments: [],
        });

        const walletPromises = [];
        const textPromises = [];

        for (const option of WALLET_OPTIONS) {
          walletPromises.push(
            client
              .useABI(RESOLVER_ABI)
              .view.get_addr_ext({
                functionArguments: [
                  account.address as `0x${string}`,
                  [...dnsNode],
                  parseInt(option.value),
                ],
                typeArguments: [],
              })
              .then(x => convertToNumberArray(x[0]))
              .then((x) => ({
                field: option.value,
                value:
                  x.length == 20 || x.length == 32
                    ? '0x' + Buffer.from(x).toString("hex")
                    : new TextDecoder().decode(new Uint8Array(x[0])),
              }))
              .catch(() => ({
                field: option.value,
                value: "",
              }))
          );
        }

        for (const option of TEXT_OPTIONS) {
          textPromises.push(
            client
              .useABI(RESOLVER_ABI)
              .view.get_text({
                functionArguments: [
                  account.address as `0x${string}`,
                  [...dnsNode],
                  option.value,
                ],
                typeArguments: [],
              })
              .then(x => x[0])
              .then((x) => ({
                field: option.value,
                value: x,
              }))
              .catch(() => ({
                field: option.value,
                value: "",
              }))
          );
        }

        const wallets = await Promise.all(walletPromises);
        const texts = await Promise.all(textPromises);

        console.log(walletAptos);
        console.log(wallets);
        console.log(texts);

        dispatch({
          type: "DATA",
          data: {
            address: walletAptos == '0x0' ? '' : walletAptos,
            addressExt: wallets.filter(x => x.value),
            text: texts.filter(x => x.value),
            contentHash: "",
            loading: false,
          },
        });
      } else {
        dispatch({
          type: "LOADING",
          loading: false,
        })
      }
    }
  }, [domainName, account, dispatch]);

  useEffect(() => {
    fetchData();
  }, [domainName, account, dispatch]);

  return [state, dispatch, fetchData];
}

export function useAptosResolverActions(domainName: string) {
  const { client } = useWalletClient();
  const dnsNode = hexEncodeName(domainName);

  const setAddr = useCallback(
    async (address: `0x${string}`) => {
      if (client) {
        const { hash } = await client.useABI(RESOLVER_ABI).set_addr({
          arguments: [[...dnsNode], address],
          type_arguments: [],
        });

        await aptos.waitForTransaction({ transactionHash: hash });
        return hash;
      }
    },
    [client]
  );

  const setAddrExt = useCallback(
    async (coinType: number, address: string) => {
      if (client) {
        // address is hex
        if (address.startsWith("0x")) {
          const hexArray = [];
          for (let i = 2; i < address.length; i += 2) {
            hexArray.push(parseInt(address.substring(i, i + 2), 16));
          }

          const { hash } = await client.useABI(RESOLVER_ABI).set_addr_ext({
            arguments: [[...dnsNode], coinType, hexArray],
            type_arguments: [],
          });

          await aptos.waitForTransaction({ transactionHash: hash });
          return hash;
        } else {
          const { hash } = await client.useABI(RESOLVER_ABI).set_addr_ext({
            arguments: [[...dnsNode], coinType, address],
            type_arguments: [],
          });

          await aptos.waitForTransaction({ transactionHash: hash });
          return hash;
        }
      }
    },
    [client]
  );

  const setText = useCallback(
    async (field: string, value: string) => {
      if (client) {
        const { hash } = await client.useABI(RESOLVER_ABI).set_text({
          arguments: [[...dnsNode], field, value],
          type_arguments: [],
        });

        await aptos.waitForTransaction({ transactionHash: hash });
        return hash;
      }
    },
    [client]
  );

  const setContentHash = useCallback(
    async (contenthash: string) => {
      if (client) {
        const { hash } = await client.useABI(RESOLVER_ABI).set_contenthash({
          arguments: [[...dnsNode], contenthash],
          type_arguments: [],
        });

        await aptos.waitForTransaction({ transactionHash: hash });
        return hash;
      }
    },
    [client]
  );

  return {
    setAddr,
    setAddrExt,
    setText,
    setContentHash,
  };
}
