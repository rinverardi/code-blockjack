import { expect } from "chai";
import { ContractTransactionReceipt, Signer } from "ethers";
import { ethers, network } from "hardhat";

import { awaitAllDecryptionResults } from "../test/asyncDecrypt";
import { getFHEGasFromTxReceipt } from "../test/coprocessorUtils";
import { debug } from "../test/utils";
import { SecureBlockjackForBenchmarks } from "../types";

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
  let contract: SecureBlockjackForBenchmarks;
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
    const factory = await ethers.getContractFactory("SecureBlockjackForBenchmarks");

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
    const gasFhe = isHardhat() ? getFHEGasFromTxReceipt(txReceipt) : "unknown";
    const gasNative = Number(txReceipt!.gasUsed);

    result.set(
      txName,
      new Map<string, number | string>().set("gasFhe", gasFhe).set("gasNative", gasNative).set("tx", txReceipt.hash),
    );
  }

  it("Play game", async function () {
    const result = new Map<string, Map<string, number | string>>();

    const createGame = await contract.createGame();
    const createGameReceipt = await createGame.wait();

    log(result, "createGame", createGameReceipt!);

    await expect(createGame).to.emit(contract, "CardsChangedForPlayer");
    await expect(createGame).to.emit(contract, "CardsChangedForDealer");
    await expect(createGame).to.emit(contract, "StateChanged").withArgs(signer, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const hitAsPlayer = await contract.hitAsPlayer();
    const hitAsPlayerReceipt = await hitAsPlayer.wait();

    log(result, "hitAsPlayer", hitAsPlayerReceipt!);

    await expect(hitAsPlayer).to.emit(contract, "CardsChangedForPlayer");
    await expect(hitAsPlayer).to.emit(contract, "StateChanged").withArgs(signer, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForPlayer

    const stand = await contract.stand();
    const standReceipt = await stand.wait();

    log(result, "stand", standReceipt!);

    await expect(stand).to.emit(contract, "StateChanged").withArgs(signer, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> WaitingForDealer

    const hitAsDealer = await contract.hitAsDealer();
    const hitAsDealerReceipt = await hitAsDealer.wait();

    log(result, "hitAsDealer", hitAsDealerReceipt!);

    await expect(hitAsDealer).to.emit(contract, "CardsChangedForDealer");
    await expect(hitAsDealer).to.emit(contract, "StateChanged").withArgs(signer, State.Checking);

    await awaitAllDecryptionResults(); // Checking -> Tie

    const game = await contract.getGame();

    if (isHardhat()) {
      expect(await decryptCards(game.cardsForPlayer)).to.deep.eq([6, 6, 6]);
      expect(await decryptCards(game.cardsForDealer)).to.deep.eq([6, 6, 6]);
    }

    expect(game.state).to.eq(State.Tie);

    this.test!.ctx!.result = result;
  });
});
