import { BrowserProvider } from "ethers";
import { FC, ReactNode, useEffect, useState } from "react";

import { createFhevmInstance } from "../fhevmjs";

const CHAINS: Record<string, string> = {
  "0x1": "Ethereum",
  "0x7a69": "Hardhat",
  "0xaa36a7": "Sepolia",
};

type WalletConnectionProps = {
  children: ReactNode;
};

export const WalletConnection: FC<WalletConnectionProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chain, setChain] = useState<string | null>(null);

  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    initialize();

    window.ethereum.on("accountsChanged", initializeAgain);
    window.ethereum.on("chainChanged", initializeAgain);
  }, []);

  async function initialize() {
    const chainId: string = await window.ethereum.request({
      method: "eth_chainId",
    });

    setChain(CHAINS[chainId] ?? chainId);
  }

  function initializeAgain() {
    setAccount(null);
    setChain(null);

    initialize();
  }

  async function onClickConnect() {
    const accounts: string[] = await provider!.send("eth_requestAccounts", []);

    if (accounts.length > 0) {
      setAccount(accounts[0]);

      await createFhevmInstance();
    }
  }

  const status = account ? (
    <>
      Connected to {chain} as {account}.
    </>
  ) : (
    <>
      Not connected.
      <button className="statusButton" onClick={onClickConnect}>
        Connect to {chain}
      </button>
    </>
  );

  return (
    <>
      <div className="status">{status}</div>
      {account && children}
    </>
  );
};

export default WalletConnection;
