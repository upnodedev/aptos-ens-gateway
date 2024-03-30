# Aptos ENS Gateway

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

## Wave 2 deployment
* **Network:** Aptos Testnet
* **Transaction:** [0xa6441771682d8b4fb263f41eec76168b7895afae65ed0a9cf84e3878554effa4](https://testnet.tracemove.io/transaction/0xa6441771682d8b4fb263f41eec76168b7895afae65ed0a9cf84e3878554effa4)
* **Module:**  [0x6f7ad109a6008ad1ac4345f97707191354c71eae72cdbb05b5170a92dccd67f1::resolver](https://testnet.tracemove.io/account/0x6f7ad109a6008ad1ac4345f97707191354c71eae72cdbb05b5170a92dccd67f1?tab=modules)
