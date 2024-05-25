import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import { DomainEns } from "../types/domain";
import { namehash, normalize } from 'viem/ens'
import TOR from "../abi/TOR.json";
import { useReadContracts } from "wagmi";

// Set up the Apollo Client
const client = new ApolloClient({
  uri: "https://api.studio.thegraph.com/proxy/49574/enssepolia/version/latest",
  cache: new InMemoryCache(),
});

// Define the query
const GET_DOMAIN = gql`
  query GetDomains($name: String!) {
    nameWrappeds(
      where: { name: $name }
      orderBy: blockNumber
      orderDirection: desc
    ) {
      id
      name
      owner {
        id
      }
      expiryDate
      domain {
        resolver {
          address
          texts
        }
      }
    }
  }
`;

export default function useEnsDomain(domainName: string): [DomainEns | null, boolean, () => Promise<void>] {
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domains_, setDomains] = useState<DomainEns[]>([]);

  const refreshDomains = useCallback(async () => {
    try {
      setDomainsLoading(true);

      if (domainName) {
        const response = await client.query({
          query: GET_DOMAIN,
          variables: { name: normalize(domainName) },
        });

        setDomains(
          response.data.nameWrappeds.map((x: any) => ({
            id: x.id,
            name: x.name,
            owner: x.owner.id,
            expiryDate: new Date(parseInt(x.expiryDate) * 1000),
            resolver: x.domain.resolver.address,
            hasCCIPContext:
              x.domain.resolver.texts?.indexOf("ccip.context") != -1,
          }))
        );
      }

      setDomainsLoading(false);
    } catch (err) {
      console.error(err);
      window.alert(
        "Domain fetching failed, please check your internet connection and refresh!"
      );
    }
  }, [domainName, setDomains]);

  useEffect(() => {
    if (domainName) {
      refreshDomains();
    } else {
      setDomains([]);
    }
  }, [domainName]);

  const CCIP_CONTEXT_CONTRACT = {
    address: "0x3c187bab6dc2c94790d4da5308672e6f799dcec3",
    abi: TOR,
    functionName: "text",
  } as const;

  const { data: ccipContexts, isPending } = useReadContracts({
    contracts: domains_.map((domain) => ({
      ...(CCIP_CONTEXT_CONTRACT as any),
      args: [namehash(domain.name), "ccip.context"],
    })),
  });

  const domains: DomainEns[] = [];
  if (ccipContexts) {
    const ccipContextTemplate = `0xA910501242cfd5f90a9dbEfD1e7923592Ab5E2d1 https://aptos-ens-gw.chom.dev/s/`;

    for (let i = 0; i < domains_.length; i++) {
      const domain = { ...domains_[i] };

      if (ccipContexts[i].status == "success") {
        if (
          (ccipContexts[i].result as string).startsWith(ccipContextTemplate) &&
          domains_[i].resolver == "0x3c187bab6dc2c94790d4da5308672e6f799dcec3"
        ) {
          domain.aptosNamespace = (ccipContexts[i].result as string).substring(
            ccipContextTemplate.length
          );
        }
      }

      domains.push(domain);
    }
  }

  const loading = domainsLoading || (isPending && domains.length > 0);

  if (domains.length == 0) {
    return [null, loading, refreshDomains]
  }

  return [domains[0], loading, refreshDomains]
}