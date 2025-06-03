import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

import { TestableBlockjack } from "../../types";

const [J, Q, K, A] = [11, 12, 13, 14];

enum State {
  Uninitialized,
  DealerWins,
  PlayerWins,
  Tie,
  Waiting,
}

describe("Blockjack", function () {
  let alice: Signer;
  let bob: Signer;

  let contract: TestableBlockjack;

  before(async function () {
    const signers = await ethers.getSigners();

    alice = signers[0];
    bob = signers[1];

    const factory = await ethers.getContractFactory("TestableBlockjack");

    contract = await factory.deploy();

    await contract.waitForDeployment();

    contract = contract.connect(bob);
  });

  beforeEach(async function () {
    const deleteGame = await contract.deleteGame();

    await deleteGame.wait();
  });

  it("create game", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 0, 9, 8, 7, 6]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(contract, "CardsChangedForPlayer").withArgs(bob, [6, 7]);
    await expect(createGame).to.emit(contract, "CardsChangedForDealer").withArgs(bob, [8, 9]);
    await expect(createGame).to.emit(contract, "StateChanged").withArgs(bob, State.Waiting);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([6, 7]);
    expect(game.cardsForDealer).to.deep.eq([8, 9]);
    expect(game.state).to.eq(State.Waiting);
  });

  it("create game again", async function () {
    const createGame = await contract.createGame();
    await createGame.wait();

    await expect(contract.createGame()).to.be.revertedWith("Illegal state");
  });

  it("dealer busts", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 9, 8, 7, 8, 7]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    const stand = await contract.stand();
    await stand.wait();

    await expect(stand).to.emit(contract, "CardsChangedForDealer").withArgs(bob, [7, 8, 9]);
    await expect(stand).to.emit(contract, "StateChanged").withArgs(bob, State.PlayerWins);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([7, 8]);
    expect(game.cardsForDealer).to.deep.eq([7, 8, 9]);
    expect(game.state).to.eq(State.PlayerWins);
  });

  it("dealer wins", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 0, Q, J, 9, 8]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    const stand = await contract.stand();
    await stand.wait();

    await expect(stand).to.emit(contract, "StateChanged").withArgs(bob, State.DealerWins);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([8, 9]);
    expect(game.cardsForDealer).to.deep.eq([J, Q]);
    expect(game.state).to.eq(State.DealerWins);
  });

  it("dealer wins early (Blockjack)", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 0, A, K, 7, 6]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(contract, "CardsChangedForPlayer").withArgs(bob, [6, 7]);
    await expect(createGame).to.emit(contract, "CardsChangedForDealer").withArgs(bob, [K, A]);
    await expect(createGame).to.emit(contract, "StateChanged").withArgs(bob, State.DealerWins);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([6, 7]);
    expect(game.cardsForDealer).to.deep.eq([K, A]);
    expect(game.state).to.eq(State.DealerWins);
  });

  it("dealer wins late", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 8, 7, 6, Q, J]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    const stand = await contract.stand();
    await stand.wait();

    await expect(stand).to.emit(contract, "CardsChangedForDealer").withArgs(bob, [6, 7, 8]);
    await expect(stand).to.emit(contract, "StateChanged").withArgs(bob, State.DealerWins);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([J, Q]);
    expect(game.cardsForDealer).to.deep.eq([6, 7, 8]);
    expect(game.state).to.eq(State.DealerWins);
  });

  it("game ends in a tie", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 0, 9, 8, 9, 8]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    const stand = await contract.stand();
    await stand.wait();

    await expect(stand).to.emit(contract, "StateChanged").withArgs(bob, State.Tie);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([8, 9]);
    expect(game.cardsForDealer).to.deep.eq([8, 9]);
    expect(game.state).to.eq(State.Tie);
  });

  it("player busts", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 9, 8, 7, 8, 7]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    const draw = await contract.draw();
    await draw.wait();

    await expect(draw).to.emit(contract, "CardsChangedForPlayer").withArgs(bob, [7, 8, 9]);
    await expect(draw).to.emit(contract, "StateChanged").withArgs(bob, State.DealerWins);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([7, 8, 9]);
    expect(game.cardsForDealer).to.deep.eq([7, 8]);
    expect(game.state).to.eq(State.DealerWins);
  });

  it("player wins", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 0, 9, 8, Q, J]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    const stand = await contract.stand();
    await stand.wait();

    await expect(stand).to.emit(contract, "StateChanged").withArgs(bob, State.PlayerWins);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([J, Q]);
    expect(game.cardsForDealer).to.deep.eq([8, 9]);
    expect(game.state).to.eq(State.PlayerWins);
  });

  it("player wins early (Blockjack)", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 0, 7, 6, A, K]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    await expect(createGame).to.emit(contract, "CardsChangedForPlayer").withArgs(bob, [K, A]);
    await expect(createGame).to.emit(contract, "StateChanged").withArgs(bob, State.PlayerWins);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([K, A]);
    expect(game.cardsForDealer).to.deep.eq([]);
    expect(game.state).to.eq(State.PlayerWins);
  });

  it("player wins late", async function () {
    const plantDeck = await contract.plantDeck([0, 0, 0, 8, Q, J, 7, 6]);
    await plantDeck.wait();

    const createGame = await contract.createGame();
    await createGame.wait();

    const draw = await contract.draw();
    await draw.wait();

    const stand = await contract.stand();
    await stand.wait();

    await expect(stand).to.emit(contract, "StateChanged").withArgs(bob, State.PlayerWins);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([6, 7, 8]);
    expect(game.cardsForDealer).to.deep.eq([J, Q]);
    expect(game.state).to.eq(State.PlayerWins);
  });
});
