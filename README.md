# Blockjack

![](https://img.shields.io/badge/Blockchain-Ethereum%20Sepolia-blue)
![](https://img.shields.io/badge/Status-Experimental-orange)

## Abstract

Blockjack is a decentralized card game running on the Ethereum blockchain.

The game is powered by a smart contract and includes an interactive web frontend. All core logic — such as dealer behavior, instant wins, and instant losses — is enforced on-chain to ensure transparency and trustlessness.

## Demonstration

[Play the game in your browser](https://blockjack.i7i.ch)! Make sure your wallet is connected to Ethereum's Testnet (Sepolia).

Doesn't work for you? [Watch a pre-recorded session instead](https://youtu.be/_M8--051nBU)!

## Documentation

Learn more about [the backend](./backend/README.md) and [the frontend](./frontend/README.md).

## Rules

Blockjack is a simplified version of Blackjack without double downs, insurance, soft aces, or splits. Number cards count as their face value, face cards count as 10 points, aces count as 11 points.

1. The player receives two cards.

   If the player has exactly 21 points, they win immediately.

2. The dealer takes two cards.

   If the dealer has exactly 21 points, they win immediately.

3. The player *may* draw additional cards while having less than 21 points.

   If the player exceeds 21 points, they lose immediately.

4. The dealer *must* draw additional cards while having less than 17 points.

   If the dealer exceeds 21 points, they lose immediately.

5. Victory goes to the higher score. Identical scores lead to a tie.
