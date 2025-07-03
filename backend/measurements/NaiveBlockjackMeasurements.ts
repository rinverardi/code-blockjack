import { expect } from "chai";
import { ContractTransactionReceipt, Signer } from "ethers";
import { ethers } from "hardhat";

import { NaiveBlockjackForMeasurements } from "../types";

enum State {
  Uninitialized,
  DealerBusts,
  DealerWins,
  PlayerBusts,
  PlayerWins,
  Tie,
  Waiting,
}

describe("Naive Blockjack", function () {
  let contract: NaiveBlockjackForMeasurements;
  let signer: Signer;

  afterEach(function () {
    const test = this.currentTest;

    if (test?.state === "passed") {
      for (const [outerKey, outerValue] of test.ctx!.result) {
        for (const [innerKey, innerValue] of outerValue) {
          console.log(`\t🞂 ${outerKey}.${innerKey}: ${innerValue}`);
        }
      }
    }
  });

  before(async function () {
    const factory = await ethers.getContractFactory("NaiveBlockjackForMeasurements");

    contract = await factory.deploy();

    await contract.waitForDeployment();

    const signers = await ethers.getSigners();

    signer = signers[0];
  });

  beforeEach(async function () {
    const deleteGame = await contract.connect(signer).deleteGame();
    await deleteGame.wait();
  });

  function log(
    result: Map<string, Map<string, number | string>>,
    txName: string,
    txReceipt: ContractTransactionReceipt,
  ) {
    const gas = txReceipt!.gasUsed;

    result.set(txName, new Map<string, number | string>().set("gas", Number(gas)).set("tx", txReceipt.hash));
  }

  it("Play game", async function () {
    const result = new Map<string, Map<string, number | string>>();

    const createGame = await contract.createGame();
    const createGameReceipt = await createGame.wait();

    log(result, "createGame", createGameReceipt!);

    await expect(createGame).to.emit(contract, "CardsChangedForPlayer").withArgs(signer, [6, 6]);
    await expect(createGame).to.emit(contract, "CardsChangedForDealer").withArgs(signer, [6, 6]);
    await expect(createGame).to.emit(contract, "StateChanged").withArgs(signer, State.Waiting);

    const hit = await contract.hit();
    const hitReceipt = await hit.wait();

    log(result, "hit", hitReceipt!);

    await expect(hit).to.emit(contract, "CardsChangedForPlayer").withArgs(signer, [6, 6, 6]);
    await expect(hit).to.emit(contract, "StateChanged").withArgs(signer, State.Waiting);

    const stand = await contract.stand();
    const standReceipt = await stand.wait();

    log(result, "stand", standReceipt!);

    await expect(stand).to.emit(contract, "CardsChangedForDealer").withArgs(signer, [6, 6, 6]);
    await expect(stand).to.emit(contract, "StateChanged").withArgs(signer, State.Tie);

    const game = await contract.getGame();

    expect(game.cardsForPlayer).to.deep.eq([6, 6, 6]);
    expect(game.cardsForDealer).to.deep.eq([6, 6, 6]);
    expect(game.state).to.eq(State.Tie);

    this.test!.ctx!.result = result;
  });
});
