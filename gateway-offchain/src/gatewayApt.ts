import { EZCCIP } from "@resolverworks/ezccip";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import packet from 'dns-packet'
import RESOLVER_ABI from "./abi/ResolverABI.js";
import { createHttpLink, ApolloClient, InMemoryCache, gql } from "@apollo/client";

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

const GET_DOMAIN = gql`
  query get_domain($domain: String, $subdomain: String) {
    current_aptos_names(
      limit: 1
      where: { subdomain: { _eq: $subdomain }, domain: { _eq: $domain } }
      order_by: { expiration_timestamp: asc }
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

function hexEncodeName(name: string) {
  return (packet as any).name.encode(name) as Buffer;
}

export let ezccip = new EZCCIP();

function buildSurfClient(network: Network) {
  const aptos = new Aptos(new AptosConfig({ network }));
  const client = createSurfClient(aptos);
  return client;
}

const SURF = {
  m: buildSurfClient(Network.MAINNET).useABI(RESOLVER_ABI),
  s: buildSurfClient(Network.TESTNET).useABI(RESOLVER_ABI),
} as const;

const APOLLO_CLIENT = {
	m: clientMainnet,
	s: clientTestnet,
} as const;

type SurfKeys = keyof typeof SURF

async function getDomainOwner(chain: 'm' | 's', name: string): Promise<[string, string]> {
	const parts = name.split('.')
	const subdomain = parts.length < 3 ? "" : parts[0];
	const domain = parts.length < 3 ? parts[0] : parts[1];

	const variables = {
		domain,
		subdomain,
	};

	// Fetch the data
	const response = await APOLLO_CLIENT[chain].query({
		query: GET_DOMAIN,
		variables: variables,
	})

	if (!response.data?.current_aptos_names[0]) {
		throw new Error("Domain not found")
	}

	return [
		response.data.current_aptos_names[0].owner_address,
		response.data.current_aptos_names[0].registered_address,
	]
}

// implement a wildcard ENSIP-10 resolver
// which handles resolve() automatically
ezccip.enableENSIP10(async (name, context) => {
  console.log(name);

	let parsedName = name;

	if (name.endsWith('apt-gw.eth') && name != 'apt-gw.eth') {
		const parts = name.split('.')
		parsedName = parts.slice(0, -2).join('.') + '.apt'
	} else {
		throw new Error("Not supported")
	}

	const chain = context.chain as SurfKeys
	const dnsNode = hexEncodeName(parsedName);

	const [domainOwner, domainRegisteredAddress] = await getDomainOwner(chain, parsedName)
	context.aptos = domainOwner

  return {
    async text(key) {
			try {
				return (await SURF[chain].view.get_text({
					functionArguments: [
						context.aptos as `0x${string}`,
						[...dnsNode],
						key,
					],
					typeArguments: [],
				}))[0]
			} catch (err) {
				return domainRegisteredAddress || ''
			}
    },
    async addr(type) {
			try {
				if (Number(type) == 637) {
					return (await SURF[chain].view.get_addr({
						functionArguments: [
							context.aptos as `0x${string}`,
							[...dnsNode],
						],
						typeArguments: [],
					}))[0]
				} else {
					const raw = (await SURF[chain].view.get_addr_ext({
						functionArguments: [
							context.aptos as `0x${string}`,
							[...dnsNode],
							Number(type),
						],
						typeArguments: [],
					}))[0]
	
					// Type bug (actual: string, definition: number[])
					return `${raw}`
				}
			} catch (err) {
				return '0x'
			}
    },
    async contenthash() {
			try {
				const raw = (await SURF[chain].view.get_contenthash({
					functionArguments: [
						context.aptos as `0x${string}`,
						[...dnsNode],
					],
					typeArguments: [],
				}))[0]
				
				// Type bug (actual: string, definition: number[])
				return `${raw}`
			} catch (err) {
				return '0x'
			}
    },
  };
});
