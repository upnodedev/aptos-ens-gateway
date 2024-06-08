import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import { DomainEns } from "../types/domain";
import { namehash, normalize } from 'viem/ens'
import TOR from "../abi/TOR.json";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { NAMEWRAPPER_CONTRACT, RESOLVER_CONTRACT } from "../constants/ens-address";

// Set up the Apollo Client
const clientTestnet = new ApolloClient({
  uri: "https://api.studio.thegraph.com/proxy/49574/enssepolia/version/latest",
  cache: new InMemoryCache(),
});

const clientMainnet = new ApolloClient({
  uri: "https://gateway-arbitrum.network.thegraph.com/api/1cef5f6d9bd083d9e78d7ddb0cc6b8d0/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH",
  cache: new InMemoryCache(),
});

// Define the query
const GET_DOMAIN = gql`
  query GetDomains($name: String!) {
    domains(
      where: { name: $name }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      name
      owner {
        id
      }
      expiryDate
      createdAt
      resolver {
        address
        texts
      }
      wrappedDomain {
        owner {
          id
        }
      }
    }
  }
`;

const GET_DOMAINS = gql`
query GetDomains($owner: String!) {
  domains(
    where: { owner: $owner }
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    name
    owner {
      id
    }
    expiryDate
    createdAt
    resolver {
      address
      texts
    }
    wrappedDomain {
      owner {
        id
      }
    }
  }
}
`;

const GET_WRAPPED_DOMAINS = gql`
  query GetDomains($owner: String!) {
    nameWrappeds(
      where: { owner: $owner }
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

export function useEnsDomain(domainName: string): [DomainEns | null, boolean, () => Promise<void>] {
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domains_, setDomains] = useState<DomainEns[]>([]);
  const chainId = useChainId()

  const refreshDomains = useCallback(async () => {
    try {
      setDomainsLoading(true);

      const client = chainId == 1 ? clientMainnet : clientTestnet

      if (domainName) {
        const response = await client.query({
          query: GET_DOMAIN,
          variables: { name: normalize(domainName) },
        });

        setDomains(
          response.data.domains.map((x: any) => ({
            id: x.id,
            name: x.name,
            owner: x.owner.id.toLowerCase() == NAMEWRAPPER_CONTRACT[chainId].toLowerCase() ? x.wrappedDomain.owner.id : x.owner.id,
            expiryDate: new Date(parseInt(x.expiryDate) * 1000),
            resolver: x.resolver.address,
            isWrapped: x.owner.id.toLowerCase() == NAMEWRAPPER_CONTRACT[chainId].toLowerCase(),
            hasCCIPContext:
              x.resolver.texts?.indexOf("ccip.context") != -1,
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
  }, [domainName, setDomains, chainId]);

  useEffect(() => {
    if (domainName && chainId) {
      refreshDomains();
    } else {
      setDomains([]);
    }
  }, [domainName, chainId]);

  const CCIP_CONTEXT_CONTRACT = {
    address: RESOLVER_CONTRACT[chainId],
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
    const ccipContextTemplate = `0xA910501242cfd5f90a9dbEfD1e7923592Ab5E2d1 https://aptos-ens-gw.chom.dev/${chainId == 1 ? 'm' : 's'}/`;

    for (let i = 0; i < domains_.length; i++) {
      const domain = { ...domains_[i] };

      if (ccipContexts[i].status == "success") {
        if (
          (ccipContexts[i].result as string).startsWith(ccipContextTemplate) &&
          domains_[i].resolver == RESOLVER_CONTRACT[chainId]
        ) {
          domain.aptosNamespace = (ccipContexts[i].result as string).substring(
            ccipContextTemplate.length
          );
        }
      }

      domains.push(domain);
    }
  }

  const loading = domainsLoading || (isPending && domains_.length > 0);

  if (domains.length == 0) {
    return [null, loading, refreshDomains]
  }

  return [domains[0], loading, refreshDomains]
}

export function useEnsDomains(): [DomainEns[], boolean, () => Promise<void>] {
  const { address } = useAccount()
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domains_, setDomains] = useState<DomainEns[]>([]);
  const chainId = useChainId()

  const refreshDomains = useCallback(async () => {
    try {
      setDomainsLoading(true);

      const client = chainId == 1 ? clientMainnet : clientTestnet

      let domains: DomainEns[] = []

      if (address) {
        {
          const response = await client.query({
            query: GET_WRAPPED_DOMAINS,
            variables: { owner: address.toLowerCase() },
          });
  
          domains = (
            response.data.nameWrappeds.map((x: any) => ({
              id: x.id,
              name: x.name,
              owner: x.owner.id,
              expiryDate: new Date(parseInt(x.expiryDate) * 1000),
              resolver: x.domain.resolver.address,
              isWrapped: true,
              hasCCIPContext:
                x.domain.resolver.texts?.indexOf("ccip.context") != -1,
            }))
          );
        }

        {
          const response = await client.query({
            query: GET_DOMAINS,
            variables: { owner: address.toLowerCase() },
          });
  
          domains = domains.concat(
            response.data.domains.filter(
              (x: any) => !x.name.endsWith('.addr.reverse')
            ).map((x: any) => ({
              id: x.id,
              name: x.name,
              owner: x.owner.id,
              expiryDate: new Date(parseInt(x.expiryDate) * 1000),
              resolver: x.resolver.address,
              isWrapped: false,
              hasCCIPContext:
                x.resolver.texts?.indexOf("ccip.context") != -1,
            }))
          )
          
        }
      }

      console.log(domains)

      setDomains(domains)
      setDomainsLoading(false);
    } catch (err) {
      console.error(err);
      window.alert(
        "Domain fetching failed, please check your internet connection and refresh!"
      );
    }
  }, [address, setDomains, chainId]);

  useEffect(() => {
    if (address && chainId) {
      refreshDomains();
    } else {
      setDomains([]);
    }
  }, [address, chainId]);

  const CCIP_CONTEXT_CONTRACT = {
    address: RESOLVER_CONTRACT[chainId],
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
    const ccipContextTemplate = `0xA910501242cfd5f90a9dbEfD1e7923592Ab5E2d1 https://aptos-ens-gw.chom.dev/${chainId == 1 ? 'm' : 's'}/`;

    for (let i = 0; i < domains_.length; i++) {
      const domain = { ...domains_[i] };

      if (ccipContexts[i].status == "success") {
        if (
          (ccipContexts[i].result as string).startsWith(ccipContextTemplate) &&
          domains_[i].resolver == RESOLVER_CONTRACT[chainId]
        ) {
          domain.aptosNamespace = (ccipContexts[i].result as string).substring(
            ccipContextTemplate.length
          );
        }
      }

      domains.push(domain);
    }
  }

  const loading = domainsLoading || (isPending && domains_.length > 0);

  if (domains.length == 0) {
    return [domains, loading, refreshDomains]
  }

  return [domains, loading, refreshDomains]
}