# Blockjack Frontend

## Developer Setup

	$ cp .env.example .env
	$ npm install

## Developer Tools

This project uses a modern development stack to ensure maintainability and reliability:

- [ethers](https://github.com/ethers-io/ethers.js)
- [ESLint](https://github.com/eslint/eslint)
- [fhevmjs](https://github.com/zama-ai/fhevmjs)
- [Prettier](https://github.com/prettier/prettier)
- [React](https://github.com/facebook/react)
- [Vite](https://github.com/vitejs/vite)

## Usage

Build the code

	$ npm run build

Lint the code:

	$ npm run lint

Run against Hardhat:

	$ npm run dev:hardhat

Run against Sepolia:

	$ npm run dev:sepolia

Point your browser to [http://localhost:4173/](http://localhost:4173/).

## Troubleshooting

Sometimes, after restarting your local Hardhat node, the frontend may get stuck or show errors due to MetaMask being out of sync. To fix this, open the MetaMask extension, switch to the Hardhat network, go to your account settings, and clear the account activity to reset the nonce and transaction history.
