import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

import { NaiveBlockjackForTesting } from "../../types";

const [J, Q, K, A] = [11, 12, 13, 14];

enum State {
  Uninitialized,
  DealerWins,
  PlayerWins,
  Tie,
  Waiting,
}

describe("Naive Blockjack", function () {
  let bob: Signer;
  let carol: Signer;

  let contract: NaiveBlockjackForTesting;

  before(async function () {
    const factory = await ethers.getContractFactory("NaiveBlockjackForTesting");

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

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 0, 9, 8, 7, 6]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer").withArgs(bob, [6, 7]);
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer").withArgs(bob, [8, 9]);
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Waiting);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([6, 7]);
    expect(game.cardsForDealer).to.deep.eq([8, 9]);
    expect(game.state).to.eq(State.Waiting);
  });

  it("Create game again for different player", async function () {
    const bobsContract = contract.connect(bob);

    const createGameAsBob = await bobsContract.createGame();
    await createGameAsBob.wait();

    const carolsContract = contract.connect(carol);

    const createGameAsCarol = await carolsContract.createGame();
    await createGameAsCarol.wait();
  });

  it("Create game again for same player", async function () {
    const bobsContract = contract.connect(bob);

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(bobsContract.createGame()).to.be.revertedWith("Illegal state");
  });

  it("Dealer busts", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 9, 8, 7, 8, 7]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "CardsChangedForDealer").withArgs(bob, [7, 8, 9]);
    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.PlayerWins);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([7, 8]);
    expect(game.cardsForDealer).to.deep.eq([7, 8, 9]);
    expect(game.state).to.eq(State.PlayerWins);
  });

  it("Dealer wins", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 0, Q, J, 9, 8]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.DealerWins);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([8, 9]);
    expect(game.cardsForDealer).to.deep.eq([J, Q]);
    expect(game.state).to.eq(State.DealerWins);
  });

  it("Dealer wins early", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 0, A, K, 7, 6]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer").withArgs(bob, [6, 7]);
    await expect(createGame).to.emit(bobsContract, "CardsChangedForDealer").withArgs(bob, [K, A]);
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.DealerWins);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([6, 7]);
    expect(game.cardsForDealer).to.deep.eq([K, A]);
    expect(game.state).to.eq(State.DealerWins);
  });

  it("Dealer wins late", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 8, 7, 6, Q, J]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "CardsChangedForDealer").withArgs(bob, [6, 7, 8]);
    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.DealerWins);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([J, Q]);
    expect(game.cardsForDealer).to.deep.eq([6, 7, 8]);
    expect(game.state).to.eq(State.DealerWins);
  });

  it("Game ends in a tie", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 0, 9, 8, 9, 8]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.Tie);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([8, 9]);
    expect(game.cardsForDealer).to.deep.eq([8, 9]);
    expect(game.state).to.eq(State.Tie);
  });

  it("Player busts", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 9, 8, 7, 8, 7]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    const hit = await bobsContract.hit();
    await hit.wait();

    await expect(hit).to.emit(bobsContract, "CardsChangedForPlayer").withArgs(bob, [7, 8, 9]);
    await expect(hit).to.emit(bobsContract, "StateChanged").withArgs(bob, State.DealerWins);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([7, 8, 9]);
    expect(game.cardsForDealer).to.deep.eq([7, 8]);
    expect(game.state).to.eq(State.DealerWins);
  });

  it("Player wins", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 0, 9, 8, Q, J]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.PlayerWins);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([J, Q]);
    expect(game.cardsForDealer).to.deep.eq([8, 9]);
    expect(game.state).to.eq(State.PlayerWins);
  });

  it("Player wins early", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 0, 7, 6, A, K]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(bobsContract, "CardsChangedForPlayer").withArgs(bob, [K, A]);
    await expect(createGame).to.emit(bobsContract, "StateChanged").withArgs(bob, State.PlayerWins);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([K, A]);
    expect(game.cardsForDealer).to.deep.eq([]);
    expect(game.state).to.eq(State.PlayerWins);
  });

  it("Player wins late", async function () {
    const bobsContract = contract.connect(bob);

    const plantDeck = await bobsContract.plantDeck([0, 0, 0, 8, Q, J, 7, 6]);
    await plantDeck.wait();

    const createGame = await bobsContract.createGame();
    await createGame.wait();

    const hit = await bobsContract.hit();
    await hit.wait();

    const stand = await bobsContract.stand();
    await stand.wait();

    await expect(stand).to.emit(bobsContract, "StateChanged").withArgs(bob, State.PlayerWins);

    const game = await bobsContract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([6, 7, 8]);
    expect(game.cardsForDealer).to.deep.eq([J, Q]);
    expect(game.state).to.eq(State.PlayerWins);
  });
});
