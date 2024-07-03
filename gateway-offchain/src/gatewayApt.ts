import { EZCCIP } from "@resolverworks/ezccip";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import packet from 'dns-packet'
import RESOLVER_ABI from "./abi/ResolverABI.js";
import { GraphQLClient, gql } from 'graphql-request';

// Initialize the GraphQL Client
const clientMainnet = new GraphQLClient('https://api.mainnet.aptoslabs.com/v1/graphql');
const clientTestnet = new GraphQLClient('https://api.testnet.aptoslabs.com/v1/graphql');

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

type ANSRecord = {
  domain: string;
  expiration_timestamp: string;
  registered_address: string;
  subdomain: string;
  token_standard: string;
  is_primary: boolean;
  owner_address: string;
};

type GetDomainResponse = {
  current_aptos_names: ANSRecord[];
};

async function getDomainOwner(chain: 'm' | 's', name: string): Promise<[string, string]> {
	const parts = name.split('.')
	const subdomain = parts.length < 3 ? "" : parts[0];
	const domain = parts.length < 3 ? parts[0] : parts[1];

	const variables = {
		domain,
		subdomain,
	};

	// Fetch the data
	const response = await APOLLO_CLIENT[chain].request<GetDomainResponse>(GET_DOMAIN, variables)

	if (!response.current_aptos_names[0]) {
		throw new Error("Domain not found")
	}

	return [
		response.current_aptos_names[0].owner_address,
		response.current_aptos_names[0].registered_address,
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
		return {}
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
				return ''
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
				if (Number(type) == 637) {
					return domainRegisteredAddress || '0x'
				}
				
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
