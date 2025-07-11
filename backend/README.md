# Blockjack Backend

## Developer Setup

	$ cp .env.example .env
	$ npm install

When testing against a local Hardhat environment, the example values are adequate. Before deploying to or testing against the Sepolia network, custom values must be configured.

## Developer Tools

This project uses a modern development stack to ensure maintainability and reliability:

- [Ethers](https://github.com/ethers-io/ethers.js/)
- [fhEVM](https://github.com/zama-ai/fhevm-solidity)
- [Hardhat](https://github.com/nomiclabs/hardhat)
- [Prettier Plugin Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity)
- [Solcover](https://github.com/sc-forks/solidity-coverage)
- [Solhint](https://github.com/protofire/solhint)
- [TypeChain](https://github.com/ethereum-ts/TypeChain)

## Usage

Clean up:

	$ npm run clean

Compile the code:

	$ npx hardhat compile

Generate the bindings:

	$ npx hardhat typechain

Lint the code:

	$ npm run lint

### Deploying on Hardhat

	$ npx hardhat node

Point your wallet to [http://localhost:8545/](http://localhost:8545/) with chain ID 31337.

### Deploying on Sepolia

	$ npx hardhat deploy --network sepolia
	$ npx hardhat verify --network sepolia {address}

### Measuring the Gas Usage

Run the measurements on Hardhat:

	$ npx hardhat test measurements/*.ts

Run the measurements on Sepolia:

	$ npx hardhat test --network sepolia measurements/*.ts

For reproducible results, the dockerized version should be used:

	$ docker build -f Dockerfile.measure-gas -t blockjack.measure-gas .

	$ docker run -t blockjack.measure-gas
	$ docker run -t blockjack.measure-gas --network sepolia

### Testing against Hardhat

In this mode, the tests are executed against a local Hardhat environment using a mocked coprocessor for simulated homomorphic encryption.

Run the tests:

	$ npm hardhat test [path]

Run the tests with coverage:

	$ npx hardhat coverage
	$ firefox coverage/index.html

### Testing against Sepolia

In this mode, the tests are executed against the Sepolia network using a pre-deployed coprocessor for real homomorphic encryption.

Run the tests:

	$ npx hardhat test --network sepolia [path]

## Troubleshooting

Analyzing RPC requests and responses is a valuable technique for debugging both automated tests running in development environments and web applications communicating via web wallets. To intercept RPC traffic, start a proxy:

	$ mitmproxy --mode reverse:https://sepolia.infura.io

Once the proxy is running, send traffic through it by setting [http://localhost:8080/](http://localhost:8080/) as the RPC URL in your development environment or web wallet.
