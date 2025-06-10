import { expect } from "chai";
import { Signer } from "ethers";
import { FhevmInstance } from "fhevmjs/node";
import { ethers } from "hardhat";

import { HomomorphicEncryption } from "../../types/contracts/demo/HomomorphicEncryption";
import { awaitAllDecryptionResults, initGateway } from "../asyncDecrypt";
import { createInstance } from "../instance";
import { reencryptEuint8 } from "../reencrypt";

describe("HomomorphicEncryption", function () {
  let alice: Signer;
  let aliceAddress: string;

  let contract: HomomorphicEncryption;
  let contractAddress: string;

  let instance: FhevmInstance;

  before(async function () {
    const signers = await ethers.getSigners();

    alice = signers[0];
    aliceAddress = await alice.getAddress();

    await initGateway();

    instance = await createInstance();
  });

  this.beforeEach(async function () {
    const factory = await ethers.getContractFactory("HomomorphicEncryption");

    contract = await factory.deploy();

    await contract.waitForDeployment();

    contractAddress = await contract.getAddress();
  });

  it("confidentialy encrypt, confidentialy decrypt", async function () {
    const input = await instance.createEncryptedInput(contractAddress, aliceAddress).add8(232).encrypt();

    const setValue = await contract.setValue(input.handles[0], input.inputProof);
    await setValue.wait();

    const handle = await contract.getHandle();
    const value = await reencryptEuint8(alice, instance, handle, contractAddress);

    expect(value).to.eq(232);
  });

  it("confidentialy encrypt, transparently decrypt", async function () {
    const input = await instance.createEncryptedInput(contractAddress, aliceAddress).add8(189).encrypt();

    const setValue = await contract.setValue(input.handles[0], input.inputProof);
    await setValue.wait();

    const valueBefore = await contract.getValue();

    expect(valueBefore).to.eq(0);

    const decryptValue = await contract.decryptValue();
    await decryptValue.wait();

    await awaitAllDecryptionResults();

    const valueAfter = await contract.getValue();

    expect(valueAfter).to.eq(189);
  });

  it("transparently encrypt, confidentialy decrypt", async function () {
    const encryptValue = await contract.encryptValue(72);
    await encryptValue.wait();

    const handle = await contract.getHandle();
    const value = await reencryptEuint8(alice, instance, handle, contractAddress);

    expect(value).to.eq(72);
  });

  it("transparently encrypt, transparently decrypt", async function () {
    const encryptValue = await contract.encryptValue(173);
    await encryptValue.wait();

    const valueBefore = await contract.getValue();

    expect(valueBefore).to.eq(0);

    const decryptValue = await contract.decryptValue();
    await decryptValue.wait();

    await awaitAllDecryptionResults();

    const valueAfter = await contract.getValue();

    expect(valueAfter).to.eq(173);
  });
});
