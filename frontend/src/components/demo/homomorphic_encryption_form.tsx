import type { HomomorphicEncryption } from "@backend-types/contracts/demo/HomomorphicEncryption";
import { BrowserProvider, Contract, Signer } from "ethers";
import { useEffect, useState } from "react";

import { wrapContract, wrapInstance } from "../../lib/chaos";
import { Progress, setProgress } from "../../lib/progress";

const HomomorphicEncryptionForm = () => {
  const [contract, setContract] = useState<(Contract & HomomorphicEncryption) | null>(null);
  const [confidentialResult, setConfidentialResult] = useState<bigint | null>(null);
  const [confidentialValue, setConfidentialValue] = useState(42n);
  const [handle, setHandle] = useState<bigint | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [transparentResult, setTransparentResult] = useState<bigint | null>(null);
  const [transparentValue, setTransparentValue] = useState(42n);

  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    (async () => {
      const signer = await provider.getSigner();

      setSigner(signer);

      const deployment = await import(
        import.meta.env.MOCKED
          ? "@backend-deployments/localhost/HomomorphicEncryption.json"
          : "@backend-deployments/sepolia/HomomorphicEncryption.json"
      );

      const contract = new Contract(deployment.address, deployment.abi, signer) as Contract & HomomorphicEncryption;

      setContract(wrapContract(contract, "HomomorphicEncryption"));
      setProgress(Progress.Idle);
    })();
  }, []);

  function onChangeConfidentialValue(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setConfidentialValue(BigInt(event.target.value));
    } catch (error) {
      alert(error);
    }
  }

  function onChangeTransparentValue(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setTransparentValue(BigInt(event.target.value));
    } catch (error) {
      alert(error);
    }
  }

  async function onClickDecryptValue() {
    setProgress(Progress.Sending);

    try {
      const decryptValue = await contract!.decryptValue();
      await decryptValue.wait();
    } catch (error) {
      alert(error);
    }

    setProgress(Progress.Idle);
  }

  async function onClickGetHandle() {
    setProgress(Progress.Sending);

    try {
      const handle = await contract!.getHandle();

      setHandle(handle);
    } catch (error) {
      alert(error);
    }

    setProgress(Progress.Idle);
  }

  async function onClickGetConfidentialValue() {
    setProgress(Progress.Receiving);

    try {
      const { publicKey, privateKey } = wrapInstance().generateKeypair();

      const eip712 = wrapInstance().createEIP712(publicKey, await contract!.getAddress());

      const signature = await signer!.signTypedData(
        eip712.domain,
        { Reencrypt: eip712.types.Reencrypt },
        eip712.message,
      );

      const result = await wrapInstance().reencrypt(
        handle!.valueOf(),
        privateKey,
        publicKey,
        signature.replace("0x", ""),
        await contract!.getAddress(),
        await signer!.getAddress(),
      );

      setConfidentialResult(result);
    } catch (error) {
      alert(error);
    }

    setProgress(Progress.Idle);
  }

  async function onClickGetTransparentValue() {
    setProgress(Progress.Sending);

    try {
      const value = await contract!.getValue();

      setTransparentResult(value);
    } catch (error) {
      alert(error);
    }

    setProgress(Progress.Idle);
  }

  async function onClickSetConfidentialValue() {
    setProgress(Progress.Sending);

    try {
      const input = await wrapInstance()
        .createEncryptedInput(await contract!.getAddress(), await signer!.getAddress())
        .add8(confidentialValue)
        .encrypt();

      const encryptValue = await contract!.setValue(input.handles[0], input.inputProof);
      await encryptValue.wait();
    } catch (error) {
      alert(error);
    }

    setProgress(Progress.Idle);
  }

  async function onClickSetTransparentValue() {
    setProgress(Progress.Sending);

    try {
      const encryptValue = await contract!.encryptValue(transparentValue);
      await encryptValue.wait();
    } catch (error) {
      alert(error);
    }

    setProgress(Progress.Idle);
  }

  function showHandle(handle: bigint | null): string | undefined {
    if (handle !== null) {
      const handleString = handle.toString(16);

      if (handleString.length < 8) {
        return handleString;
      } else {
        return `${handleString.slice(0, 4)}...${handleString.slice(-4)}`;
      }
    }
  }

  return (
    <>
      <h1>Homomorphic Encryption</h1>
      <p>
        <span>function</span>
        <button onClick={onClickDecryptValue}>decryptValue</button>
        <span>{"( )"}</span>
      </p>
      <p>
        <span>function</span>
        <button onClick={onClickGetHandle}>getHandle</button>
        <span>{"( )"} &rarr;</span>
        <input readOnly value={showHandle(handle)} />
      </p>
      <p>
        <span>function</span>
        <button onClick={onClickGetConfidentialValue}>getConfidentialValue</button>
        <span>{"("}</span>
        <input readOnly value={showHandle(handle)} />
        <span>{")"} &rarr;</span>
        <input readOnly value={confidentialResult?.toString()} />
      </p>
      <p>
        <span>function</span>
        <button onClick={onClickGetTransparentValue}>getTransparentValue</button>
        <span>{"( )"} &rarr;</span>
        <input readOnly value={transparentResult?.toString()} />
      </p>
      <p>
        <span>function</span>
        <button onClick={onClickSetConfidentialValue}>setConfidentialValue</button>
        <span>{"("}</span>
        <input onChange={onChangeConfidentialValue} value={confidentialValue.toString()} />
        <span>{")"}</span>
      </p>
      <p>
        <span>function</span>
        <button onClick={onClickSetTransparentValue}>setTransparentValue</button>
        <span>{"("}</span>
        <input onChange={onChangeTransparentValue} value={transparentValue.toString()} />
        <span>{")"}</span>
      </p>
    </>
  );
};

export default HomomorphicEncryptionForm;
