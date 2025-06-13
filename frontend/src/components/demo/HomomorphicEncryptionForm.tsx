import type { HomomorphicEncryption } from "@backend-types/contracts/demo/HomomorphicEncryption";
import { BrowserProvider, Contract, Signer } from "ethers";
import { useEffect, useState } from "react";

import { wrapContract, wrapInstance } from "../../lib/Chaos";

export const HomomorphicEncryptionForm = () => {
  const [busy, setBusy] = useState<boolean>(false);
  const [contract, setContract] = useState<(Contract & HomomorphicEncryption) | null>(null);
  const [confidentialResult, setConfidentialResult] = useState<bigint | null>(null);
  const [confidentialValue, setConfidentialValue] = useState(42n);
  const [handle, setHandle] = useState<bigint | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [transparentResult, setTransparentResult] = useState<bigint | null>(null);
  const [transparentValue, setTransparentValue] = useState(42n);

  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    async function init() {
      const signer = await provider.getSigner();

      setSigner(signer);

      const deployment = await import(
        import.meta.env.MOCKED
          ? "@backend-deployments/localhost/HomomorphicEncryption.json"
          : "@backend-deployments/sepolia/HomomorphicEncryption.json"
      );

      const contract = new Contract(deployment.address, deployment.abi, signer) as Contract & HomomorphicEncryption;

      setContract(wrapContract(contract, "HomomorphicEncryption"));
    }

    init();
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
    setBusy(true);

    try {
      const decryptValue = await contract!.decryptValue();
      await decryptValue.wait();
    } catch (error) {
      alert(error);
    }

    setBusy(false);
  }

  async function onClickGetHandle() {
    setBusy(true);

    try {
      const handle = await contract!.getHandle();

      setHandle(handle);
    } catch (error) {
      alert(error);
    }

    setBusy(false);
  }

  async function onClickGetConfidentialValue() {
    setBusy(true);

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

    setBusy(false);
  }

  async function onClickGetTransparentValue() {
    setBusy(true);

    try {
      const value = await contract!.getValue();

      setTransparentResult(value);
    } catch (error) {
      alert(error);
    }

    setBusy(false);
  }

  async function onClickSetConfidentialValue() {
    setBusy(true);

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

    setBusy(false);
  }

  async function onClickSetTransparentValue() {
    setBusy(true);

    try {
      const encryptValue = await contract!.encryptValue(transparentValue);
      await encryptValue.wait();
    } catch (error) {
      alert(error);
    }

    setBusy(false);
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
        function
        <button onClick={onClickDecryptValue}>decryptValue</button>
        {"( )"}
      </p>
      <p>
        function
        <button onClick={onClickGetHandle}>getHandle</button>
        {"( )"} &rarr;
        <input readOnly value={showHandle(handle)} />
      </p>
      <p>
        function
        <button onClick={onClickGetConfidentialValue}>getConfidentialValue</button>
        {"("}
        <input readOnly value={showHandle(handle)} />
        {")"} &rarr;
        <input readOnly value={confidentialResult?.toString()} />
      </p>
      <p>
        function
        <button onClick={onClickGetTransparentValue}>getTransparentValue</button>
        {"( )"} &rarr;
        <input readOnly value={transparentResult?.toString()} />
      </p>
      <p>
        function
        <button onClick={onClickSetConfidentialValue}>setConfidentialValue</button>
        {"("}
        <input onChange={onChangeConfidentialValue} value={confidentialValue.toString()} />
        {")"}
      </p>
      <p>
        function
        <button onClick={onClickSetTransparentValue}>setTransparentValue</button>
        {"("}
        <input onChange={onChangeTransparentValue} value={transparentValue.toString()} />
        {")"}
      </p>
      <span className={"indicator indicator" + (busy ? "Busy" : "Idle")}>{busy ? "Busy" : "Idle"}</span>
    </>
  );
};

export default HomomorphicEncryptionForm;
