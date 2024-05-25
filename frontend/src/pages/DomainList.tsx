import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { DomainEns } from "../types/domain";
import TOR from "../abi/TOR.json";
import { namehash } from "viem";
import { Button, Skeleton } from "antd";
import { Link } from "react-router-dom";
import DomainENS from "../components/DomainENS";

// Set up the Apollo Client
const client = new ApolloClient({
  uri: "https://api.studio.thegraph.com/proxy/49574/enssepolia/version/latest",
  cache: new InMemoryCache(),
});

// Define the query
const GET_DOMAINS = gql`
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

export default function DomainList() {
  const { address } = useAccount();

  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domains_, setDomains] = useState<DomainEns[]>([]);

  const refreshDomains = useCallback(async () => {
    try {
      setDomainsLoading(true);

      if (address) {
        const response = await client.query({
          query: GET_DOMAINS,
          variables: { owner: address.toLowerCase() },
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
  }, [address, setDomains]);

  useEffect(() => {
    if (address) {
      refreshDomains();
    } else {
      setDomains([]);
    }
  }, [address]);

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

  const loading = domainsLoading || isPending;

  console.log(domains);

  return (
    <div>
      <div className="flex flex-col items-center mt-8">
        <div className="text-4xl mb-1">Your Domains</div>
        <div>Manage ENS domains on Aptos!</div>
      </div>

      {loading ? (
        <Skeleton active className="mt-8"></Skeleton>
      ) : domains.length == 0 ? (
        <div className="flex flex-col items-center mt-8">
          <div className="mb-2">You don't have any domains!</div>
          <a href="https://ens.domains">
            <Button>Register ENS Domains</Button>
          </a>
        </div>
      ) : (
        <div className="grid gap-3 mt-8">
          {domains.map((domain) => (
            <div key={domain.id}>
              <Link to={`/${domain.name}`}>
                <div className="rounded border border-gray shadow bg-white p-3 transition hover:cursor-pointer hover:bg-gray-50">
                  <DomainENS domain={domain}></DomainENS>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
