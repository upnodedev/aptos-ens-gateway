# Aptos ENS Gateway

Testnet: [Live Website](https://aptos-ens.chom.dev) | [Contract Module](https://explorer.aptoslabs.com/account/0x4aac1f0a41d1251b67e7623b3bdf3034cbd4bb05938a1129ddd9dec3ba8ed200/modules/code/resolver?network=testnet)

Aptos ENS Gateway is a gateway for connecting ENS domains to Aptos.

We reference implementation from ENS's official EVM Gateway: https://github.com/ensdomains/evmgateway and migrate them to the Move smart contract module deployed on the Aptos chain.

What this project enables:
* This project enables Aptos name to store resolver records in a similar way to ENS domains
* This project enables Aptos name to be resolved by the ENS name (For example, we can point chomtana.eth -> chomtana.apt)
* This project enables ENS domain names to store resolver records in the Aptos chain instead of the Ethereum Mainnet
* This project can potentially collaborate with the official Aptos Names (https://www.aptosnames.com)

It solves the acceptance problem of Aptos domains. Web 3 is unofficially considered ENS as an ICANN for Web 3 due to being the first mover with a valid DAO-based structure. So, it's a good idea to collaborate with ENS.

I have a track record of contributing to the official ENS EVM Gateway developed. Proving my skill and understanding of ENS Gateway.
* [Pull request to the official ENS EVM Gateway to patch Optimism fault-proof breaking changes](https://github.com/ensdomains/evmgateway/pull/36)
* [Discussion on ENS DAO forum about Optimism fault-proof breaking changes on EVM Gateway](https://discuss.ens.domains/t/op-fault-proof-upgrade-break-op-verifier-and-op-gateway-implementation-in-the-evm-gateway/18973)

## Classical ENS Smart Contracts

![image](https://github.com/Chomtana/aptos-ens-gateway/assets/4103490/0daae5a3-ca64-4ff4-88aa-ca14967427f1)

In the classical ENS smart contract system, which limits resolution to Layer 1 only, we have the ENSRegistry. This registry manages domain metadata such as ownership and the resolver address, which is registered from the Registrar contract. Clients look up specific records set in the resolver, which acts as its own storage system.

## ENS Scaling Solutions for Aptos

![image](https://github.com/Chomtana/aptos-ens-gateway/assets/4103490/41b37e13-685b-43f4-b4ef-dc64d302a178)

With the emergence of Layer 2 chains, ENS has explored various scaling solutions and ultimately selected the CCIP Gateway. The CCIP Gateway allows clients to query values from off-chain databases or other chains and verify them against a verifier embedded in the resolver instead of using traditional storage. This approach secures the data from the CCIP Gateway, ensuring that it cannot return faulty values because they would be rejected by the verifier.

The design of the resolver module and storage object is particularly suitable for Aptos, as the storage object is owned by the user. An object is identified by a pair consisting of a user and a domain namehash.

For the Aptos name service, every .apt domain can be converted into a namehash, and our resolver module can extend the capabilities of the Aptos name service to set more records than just wallet addresses, such as social accounts. This also enables integration with the ENS ecosystem through subdomains.

## Aptos CCIP Gateway and Verifier

![image](https://github.com/Chomtana/aptos-ens-gateway/assets/4103490/d6234af8-b9cd-4a0e-a3d6-31fb7d0e4d01)

When a user sets the domain record on Aptos through the Resolver module, the corresponding storage object is updated. The root submitter then listens for an event emitted from the module to update the state root. This updated state root is subsequently submitted to the Resolver Root Oracle contract on ENS-supported L2 chains, such as Optimism. However, since the root submitter might commit fraud, a challenger mechanism is essential. This mechanism trustlessly submits a fraud Merkle proof from the Resolver module through LayerZero to the challenger contract on Optimism.

We could always rely on LayerZero, but this would unnecessarily increase the cost. Once the state root is submitted to Optimism, it is rolled up to the Ethereum mainnet. The CCIP gateway then fetches data from Aptos RPC as usual, with additional proof sent to the Verifier. This proof ensures that the state root is successfully submitted to Optimism and that the data is included in the state Merkle tree.

If the Verifier successfully verifies the proof, the data is returned to the client. This approach aligns with the ENS vision, as ENS accepts verifying data from Optimism and Arbitrum. We relay data securely and optimistically from the Aptos chain.
