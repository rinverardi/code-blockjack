import { expect } from "chai";
import { Signer } from "ethers";
import { FhevmInstance } from "fhevmjs/node";
import { ethers } from "hardhat";

import { HomomorphicArithmetic } from "../../types/contracts/demo/HomomorphicArithmetic";
import { initGateway } from "../asyncDecrypt";
import { createInstance } from "../instance";
import { reencryptEuint8 } from "../reencrypt";

describe("HomomorphicArithmetic", function () {
  let alice: Signer;
  let aliceAddress: string;

  let contract: HomomorphicArithmetic;
  let contractAddress: string;

  let instance: FhevmInstance;

  afterEach(function () {
    const test = this.currentTest;

    if (test?.state === "passed") {
      console.log(`\t🞂 ${test.ctx!.result}`);
    }
  });

  before(async function () {
    const signers = await ethers.getSigners();

    alice = signers[0];
    aliceAddress = await alice.getAddress();

    await initGateway();

    instance = await createInstance();
  });

  this.beforeEach(async function () {
    const factory = await ethers.getContractFactory("HomomorphicArithmetic");

    contract = await factory.deploy();

    await contract.waitForDeployment();

    contractAddress = await contract.getAddress();
  });

  it("add values", async function () {
    const input = await instance.createEncryptedInput(contractAddress, aliceAddress).add8(42).add8(43).encrypt();

    const addValues = await contract.addValues(input.handles[0], input.handles[1], input.inputProof);
    await addValues.wait();

    const handle = await contract.getHandle();
    const result = await reencryptEuint8(alice, instance, handle, contractAddress);

    expect(result).to.eq(85);

    this.test!.ctx!.result = result;
  });

  it("mmultiply values", async function () {
    const input = await instance.createEncryptedInput(contractAddress, aliceAddress).add8(6).add8(7).encrypt();

    const addValues = await contract.multiplyValues(input.handles[0], input.handles[1], input.inputProof);
    await addValues.wait();

    const handle = await contract.getHandle();
    const result = await reencryptEuint8(alice, instance, handle, contractAddress);

    expect(result).to.eq(42);

    this.test!.ctx!.result = result;
  });

  it("random value", async function () {
    const randomValue = await contract.randomValue();
    await randomValue.wait();

    const handle = await contract.getHandle();

    this.test!.ctx!.result = await reencryptEuint8(alice, instance, handle, contractAddress);
  });
});
