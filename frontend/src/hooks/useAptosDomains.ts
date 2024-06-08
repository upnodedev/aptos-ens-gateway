import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';
import { DomainEns } from '../types/domain';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useCallback, useEffect, useState } from 'react';
import { Network } from '@aptos-labs/ts-sdk';

// Define the GraphQL endpoint
const httpLinkMainnet = createHttpLink({
  uri: 'https://api.mainnet.aptoslabs.com/v1/graphql',
});

const httpLinkTestnet = createHttpLink({
  uri: 'https://api.testnet.aptoslabs.com/v1/graphql',
});

// Initialize the Apollo Client
const clientMainnet = new ApolloClient({
  link: httpLinkMainnet,
  cache: new InMemoryCache(),
});

const clientTestnet = new ApolloClient({
  link: httpLinkTestnet,
  cache: new InMemoryCache(),
});

// Define the query and variables
const GET_DOMAINS = gql`
  query get_domains($owner_address: String, $expiration_lte: timestamp, $expiration_gte: timestamp, $token_standard: [String!], $offset: Int, $limit: Int) {
    current_aptos_names(
      limit: $limit
      where: {owner_address: {_eq: $owner_address}, subdomain: {_eq: ""}, expiration_timestamp: {_gte: $expiration_gte, _lte: $expiration_lte}, token_standard: {_in: $token_standard}}
      order_by: [{is_primary: desc}, {expiration_timestamp: asc}]
      offset: $offset
    ) {
      ...ANS_RECORD
    }
  }

  fragment ANS_RECORD on current_aptos_names {
    domain
    expiration_timestamp
    registered_address
    subdomain
    token_standard
    is_primary
    owner_address
  }
`;

export function useAptosDomains(): [DomainEns[], boolean, () => Promise<void>] {
  const wallet = useWallet()
  const [domains, setDomains] = useState<DomainEns[]>([])
  const [loading, setLoading] = useState(true)

  const refreshDomains = useCallback(async () => {
    if (wallet) {
      try {
        setLoading(true)

        const client = wallet.network?.name == Network.MAINNET ? clientMainnet : clientTestnet

        const variables = {
          owner_address: wallet.account?.address,
          offset: 0,
          expiration_lte: "3000-01-01T00:00:00.000Z",
          expiration_gte: "2024-05-08T14:31:36.298Z",
          limit: 20,
          token_standard: ["v1", "v2"]
        };
        
        // Fetch the data
        const response = await client.query({
          query: GET_DOMAINS,
          variables: variables,
        })

        console.log(response)

        const domains: DomainEns[] = []

        for (const domain of response.data.current_aptos_names) {
          domains.push({
            id: domain.domain + '.apt',
            name: domain.domain + '.apt',
            expiryDate: new Date(domain.expiration_timestamp),
            hasCCIPContext: false,
            owner: domain.owner_address,
            resolver: "",
            isApt: true
          })
        }

        setDomains(domains)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }, [wallet, setLoading, setDomains])
  
  useEffect(() => {
    refreshDomains()
  }, [wallet])

  return [domains, loading, refreshDomains]
}

export function useAptosDomain(domainName: string): [DomainEns | null, boolean, () => Promise<void>] {
  const [aptosDomains, aptosDomainsLoading, refreshAptosDomains] = useAptosDomains();
  
  if (domainName.endsWith('.eth')) {
    return [
      null,
      false,
      async () => {},
    ]
  }
  
  return [
    aptosDomains.find(x => x.name == domainName) ?? null,
    aptosDomainsLoading,
    refreshAptosDomains,
  ]
}
