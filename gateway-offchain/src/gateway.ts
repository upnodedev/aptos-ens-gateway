import { EZCCIP } from "@resolverworks/ezccip";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import packet from 'dns-packet'
import RESOLVER_ABI from "./abi/ResolverABI.js";

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

type SurfKeys = keyof typeof SURF

// implement a wildcard ENSIP-10 resolver
// which handles resolve() automatically
ezccip.enableENSIP10(async (name, context) => {
  console.log(name, context.aptos);
	const chain = context.chain as SurfKeys
	const dnsNode = hexEncodeName(name);

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
	
					return '0x' + Buffer.from(raw).toString("hex")
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
				
				return '0x' + Buffer.from(raw).toString("hex")
			} catch (err) {
				return '0x'
			}
    },
  };
});
