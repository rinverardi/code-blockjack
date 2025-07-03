import type { HomomorphicArithmetic } from "@backend-types/contracts/demo/HomomorphicArithmetic";
import { BrowserProvider, Contract, Signer } from "ethers";
import { useEffect, useState } from "react";

import { getInstance } from "../../lib/fhevm/fhevmjs";
import { Progress, setProgress } from "../../lib/progress";

const HomomorphicArithmeticForm = () => {
  const [addParam0, setAddParam0] = useState(42n);
  const [addParam1, setAddParam1] = useState(43n);
  const [addResult, setAddResult] = useState<bigint>();
  const [contract, setContract] = useState<Contract & HomomorphicArithmetic>();
  const [multiplyParam0, setMultiplyParam0] = useState(6n);
  const [multiplyParam1, setMultiplyParam1] = useState(7n);
  const [multiplyResult, setMultiplyResult] = useState<bigint>();
  const [randomResult, setRandomResult] = useState<bigint>();
  const [signer, setSigner] = useState<Signer>();

  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    (async () => {
      const signer = await provider.getSigner();

      setSigner(signer);

      const deployment = await import(
        import.meta.env.MOCKED
          ? "@backend-deployments/localhost/HomomorphicArithmetic.json"
          : "@backend-deployments/sepolia/HomomorphicArithmetic.json"
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const contract = new Contract(deployment.address, deployment.abi, signer) as Contract & HomomorphicArithmetic;

      setContract(contract);
      setProgress(Progress.Idle);
    })().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getResult() {
    setProgress(Progress.Receiving);

    const { publicKey, privateKey } = getInstance().generateKeypair();

    const signatureData = getInstance().createEIP712(publicKey, await contract!.getAddress());

    const signature = await signer!.signTypedData(
      signatureData.domain,
      { Reencrypt: signatureData.types.Reencrypt },
      signatureData.message,
    );

    return await getInstance().reencrypt(
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
      console.error(error);
    }
  }

  function onChangeAddParam1(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setAddParam1(BigInt(event.target.value));
    } catch (error) {
      console.error(error);
    }
  }

  function onChangeMultiplyParam0(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setMultiplyParam0(BigInt(event.target.value));
    } catch (error) {
      console.error(error);
    }
  }

  function onChangeMultiplyParam1(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setMultiplyParam1(BigInt(event.target.value));
    } catch (error) {
      console.error(error);
    }
  }

  async function onClickAddValues() {
    setProgress(Progress.Sending);

    try {
      const input = await getInstance()
        .createEncryptedInput(await contract!.getAddress(), await signer!.getAddress())
        .add8(addParam0)
        .add8(addParam1)
        .encrypt();

      const addValues = await contract!.addValues(input.handles[0], input.handles[1], input.inputProof);
      await addValues.wait();

      setAddResult(await getResult());
    } catch (error) {
      console.error(error);
    }

    setProgress(Progress.Idle);
  }

  async function onClickMultiplyValues() {
    setProgress(Progress.Sending);

    try {
      const input = await getInstance()
        .createEncryptedInput(await contract!.getAddress(), await signer!.getAddress())
        .add8(multiplyParam0)
        .add8(multiplyParam1)
        .encrypt();

      const addValues = await contract!.multiplyValues(input.handles[0], input.handles[1], input.inputProof);
      await addValues.wait();

      setMultiplyResult(await getResult());
    } catch (error) {
      console.error(error);
    }

    setProgress(Progress.Idle);
  }

  async function onClickRandomValue() {
    setProgress(Progress.Sending);

    try {
      const randomValue = await contract!.randomValue();
      await randomValue.wait();

      setRandomResult(await getResult());
    } catch (error) {
      console.error(error);
    }

    setProgress(Progress.Idle);
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
