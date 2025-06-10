import { Signer } from "ethers";
import { FhevmInstance } from "fhevmjs/node";
import { ethers } from "hardhat";

import { HomomorphicArithmetic } from "../../types/contracts/demo/HomomorphicArithmetic";
import { initGateway } from "../asyncDecrypt";
import { createInstance } from "../instance";
import { debug } from "../utils";

describe("HomomorphicArithmetic", function () {

  // XXX Clean up!

  let alice: Signer;
  let aliceAddress: string;

  // XXX Clean up!

  let contract: HomomorphicArithmetic;
  let contractAddress: string;

  // XXX Clean up!

  let instance: FhevmInstance;

  // XXX Clean up!

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

  it("random value", async function () {
    const randomValue = await contract.randomValue();
    await randomValue.wait();

    const handle = await contract.getHandle();
    const value = await debug.decrypt8(handle);

    console.log("\tvalue", value);
  });
});
