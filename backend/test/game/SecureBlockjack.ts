import { expect } from "chai";
import { Signer } from "ethers";
import { ethers, network } from "hardhat";

import { SecureBlockjackForTesting } from "../../types";
import { awaitAllDecryptionResults } from "../asyncDecrypt";
import { debug } from "../utils";

const [J, Q, K, A] = [11, 12, 13, 14];

enum State {
  Uninitialized,
  Checking,
  DealerBusts,
  DealerWins,
  PlayerBusts,
  PlayerWins,
  Tie,
  WaitingForDealer,
  WaitingForPlayer,
}

async function decryptCards(cards: bigint[]) {
  return await Promise.all(cards.map(debug.decrypt8));
}

function isHardhat() {
  return network.name === "hardhat";
}

describe("Secure Blockjack", function () {
  let bob: Signer;
  let carol: Signer;

  let contract: SecureBlockjackForTesting;

  before(async function () {
    const factory = await ethers.getContractFactory("SecureBlockjackForTesting");

    contract = await factory.deploy();

    await contract.waitForDeployment();

    const signers = await ethers.getSigners();

    bob = signers[1];
    carol = signers[2];
  });

  beforeEach(async function () {
    for (const player of [bob, carol]) {
      const deleteGame = await contract.connect(player).deleteGame();
      await deleteGame.wait();
    }
  });

  it("Create game", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([9, 8, 7, 6]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([6, 7]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([8, 9]);
    }

    expect(game.state).to.eq(State.WaitingForPlayer);
  });

  it("Create game again for different player", async function () {
    const bobsContract = contract.connect(bob);

    const createGameAsBob = await bobsContract.createGame();
    await createGameAsBob.wait();

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const carolsContract = contract.connect(carol);

    const createGameAsCarol = await carolsContract.createGame();
    await createGameAsCarol.wait();

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer
  });

  it("Create game again for same player", async function () {
    const bobsContract = contract.connect(bob);

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    await expect(bobsContract.createGame()).to.be.revertedWith("Illegal state");
  });

  it("Dealer busts early", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([A, A, 8, 7]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> DealerBusts

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([7, 8]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([A, A]);
    }

    expect(game.state).to.eq(State.DealerBusts);
  });

  it("Dealer busts late", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([9, 8, 7, 8, 7]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForDealer

    const hitAsDealer = await bobsContract.hitAsDealer();
    await hitAsDealer.wait();

    await expect(hitAsDealer).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(hitAsDealer).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> DealerBusts

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([7, 8]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([7, 8, 9]);
    }

    expect(game.state).to.eq(State.DealerBusts);
  });

  it("Dealer wins", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([Q, J, 9, 8]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> DealerWins

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([8, 9]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([J, Q]);
    }

    expect(game.state).to.eq(State.DealerWins);
  });

  it("Dealer wins early", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([A, K, 7, 6]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([6, 7]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([K, A]);
    }

    expect(game.state).to.eq(State.DealerWins);
  });

  it("Dealer wins late", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([8, 7, 6, Q, J]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForDealer

    const hitAsDealer = await bobsContract.hitAsDealer();
    await hitAsDealer.wait();

    await expect(hitAsDealer).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(hitAsDealer).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> DealerWins

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([J, Q]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([6, 7, 8]);
    }

    expect(game.state).to.eq(State.DealerWins);
  });

  it("Game ends in a tie", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([9, 8, 9, 8]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> Tie

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([8, 9]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([8, 9]);
    }

    expect(game.state).to.eq(State.Tie);
  });

  it("Player busts early", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([8, 7, A, A]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> PlayerBusts

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([A, A]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([7, 8]);
    }

    expect(game.state).to.eq(State.PlayerBusts);
  });

  it("Player busts late", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([9, 8, 7, 8, 7]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const hitAsPlayer = await bobsContract.hitAsPlayer();
    await hitAsPlayer.wait();

    await expect(hitAsPlayer).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(hitAsPlayer).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> PlayerBusts

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([7, 8, 9]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([7, 8]);
    }

    expect(game.state).to.eq(State.PlayerBusts);
  });

  it("Player wins", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([9, 8, Q, J]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> PlayerWins

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([J, Q]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([8, 9]);
    }

    expect(game.state).to.eq(State.PlayerWins);
  });

  it("Player wins early", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([7, 6, A, K]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> PlayerWins

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([K, A]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([6, 7]);
    }

    expect(game.state).to.eq(State.PlayerWins);
  });

  it("Player wins late", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([8, Q, J, 7, 6]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer");
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const hitAsPlayer = await bobsContract.hitAsPlayer();
    await hitAsPlayer.wait();

    await expect(hitAsPlayer).to.emit(bobsContract, "CardsChangedForPlayer");
    await expect(hitAsPlayer).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> PlayerWins

    const game = await bobsContract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([6, 7, 8]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([J, Q]);
    }

    expect(game.state).to.eq(State.PlayerWins);
  });
});
