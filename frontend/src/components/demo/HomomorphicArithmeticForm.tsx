import type { HomomorphicArithmetic } from "@backend-types/contracts/demo/HomomorphicArithmetic";
import { BrowserProvider, Contract, Signer } from "ethers";
import { useEffect, useState } from "react";

import { wrapContract, wrapInstance } from "../../lib/Chaos";
import { toggleProgress } from "../../lib/Progress";

export const HomomorphicArithmeticForm = () => {
  const [addParam0, setAddParam0] = useState(42n);
  const [addParam1, setAddParam1] = useState(43n);
  const [addResult, setAddResult] = useState<bigint | null>(null);
  const [contract, setContract] = useState<(Contract & HomomorphicArithmetic) | null>(null);
  const [multiplyParam0, setMultiplyParam0] = useState(6n);
  const [multiplyParam1, setMultiplyParam1] = useState(7n);
  const [multiplyResult, setMultiplyResult] = useState<bigint | null>(null);
  const [randomResult, setRandomResult] = useState<bigint | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);

  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    async function init() {
      const signer = await provider.getSigner();

      setSigner(signer);

      const deployment = await import(
        import.meta.env.MOCKED
          ? "@backend-deployments/localhost/HomomorphicArithmetic.json"
          : "@backend-deployments/sepolia/HomomorphicArithmetic.json"
      );

      const contract = new Contract(deployment.address, deployment.abi, signer) as Contract & HomomorphicArithmetic;

      setContract(wrapContract(contract, "HomomorphicArithmetic"));
    }

    init();
  }, []);

  async function getResult() {
    const { publicKey, privateKey } = wrapInstance().generateKeypair();

    const signatureData = wrapInstance().createEIP712(publicKey, await contract!.getAddress());

    const signature = await signer!.signTypedData(
      signatureData.domain,
      { Reencrypt: signatureData.types.Reencrypt },
      signatureData.message,
    );

    return await wrapInstance().reencrypt(
      await contract!.getHandle(),
      privateKey,
      publicKey,
      signature.replace("0x", ""),
      await contract!.getAddress(),
      await signer!.getAddress(),
    );
  }

  function onChangeAddParam0(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setAddParam0(BigInt(event.target.value));
    } catch (error) {
      alert(error);
    }
  }

  function onChangeAddParam1(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setAddParam1(BigInt(event.target.value));
    } catch (error) {
      alert(error);
    }
  }

  function onChangeMultiplyParam0(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setMultiplyParam0(BigInt(event.target.value));
    } catch (error) {
      alert(error);
    }
  }

  function onChangeMultiplyParam1(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setMultiplyParam1(BigInt(event.target.value));
    } catch (error) {
      alert(error);
    }
  }

  async function onClickAddValues() {
    toggleProgress(true);

    try {
      const input = await wrapInstance()
        .createEncryptedInput(await contract!.getAddress(), await signer!.getAddress())
        .add8(addParam0)
        .add8(addParam1)
        .encrypt();

      const addValues = await contract!.addValues(input.handles[0], input.handles[1], input.inputProof);
      await addValues.wait();

      setAddResult(await getResult());
    } catch (error) {
      alert(error);
    }

    toggleProgress(false);
  }

  async function onClickMultiplyValues() {
    toggleProgress(true);

    try {
      const input = await wrapInstance()
        .createEncryptedInput(await contract!.getAddress(), await signer!.getAddress())
        .add8(multiplyParam0)
        .add8(multiplyParam1)
        .encrypt();

      const addValues = await contract!.multiplyValues(input.handles[0], input.handles[1], input.inputProof);
      await addValues.wait();

      setMultiplyResult(await getResult());
    } catch (error) {
      alert(error);
    }

    toggleProgress(false);
  }

  async function onClickRandomValue() {
    toggleProgress(true);

    try {
      const randomValue = await contract!.randomValue();
      await randomValue.wait();

      setRandomResult(await getResult());
    } catch (error) {
      alert(error);
    }

    toggleProgress(false);
  }

  return (
    <>
      <h1>Homomorphic Arithmetic</h1>
      <p>
        <span>function</span>
        <button onClick={onClickAddValues}>addValues</button>
        <span>{"("}</span>
        <input onChange={onChangeAddParam0} value={addParam0.toString()} />
        <span>,</span>
        <input onChange={onChangeAddParam1} value={addParam1.toString()} />
        <span>{")"} &rarr;</span>
        <input readOnly value={addResult?.toString()} />
      </p>
      <p>
        <span>function</span>
        <button onClick={onClickMultiplyValues}>multiplyValues</button>
        <span>{"("}</span>
        <input onChange={onChangeMultiplyParam0} value={multiplyParam0.toString()} />
        <span>,</span>
        <input onChange={onChangeMultiplyParam1} value={multiplyParam1.toString()} />
        <span>{")"} &rarr;</span>
        <input readOnly value={multiplyResult?.toString()} />
      </p>
      <p>
        <span>function</span>
        <button onClick={onClickRandomValue}>randomValue</button>
        <span>{"( )"} &rarr;</span>
        <input readOnly value={randomResult?.toString()} />
      </p>
    </>
  );
};

export default HomomorphicArithmeticForm;
