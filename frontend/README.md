# Blockjack Frontend

## Developer Setup

	$ cp .env.example .env
	$ npm install

## Developer Tools

This project uses a modern development stack to ensure maintainability and reliability:

- [Ethers](https://ethers.org/)
- [ESLint](https://eslint.org/)
- [fhevmjs](https://docs.zama.ai/fhevm/references/fhevmjs)
- [Prettier](https://prettier.io/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)

## Usage

Build the code

	$ npm run build

Lint the code:

	$ npm run lint

Run against Hardhat:

	$ npm run dev-mocked

Run against Sepolia:

	$ npm run dev

Point your browser to [http://localhost:4173/](http://localhost:4173/).

## Troubleshooting

Sometimes, after restarting your local Hardhat node, the frontend may get stuck or show errors due to MetaMask being out of sync. To fix this, open the MetaMask extension, switch to the Hardhat network, go to your account settings, and clear the account activity to reset the nonce and transaction history.
