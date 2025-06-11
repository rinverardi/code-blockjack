import { BrowserProvider } from "ethers";
import { FC, ReactNode, useEffect, useState } from "react";

import "../fhevmjs";
import "./Connection.css";

const CHAINS: Record<string, string> = {
  "0x1": "Ethereum",
  "0x7a69": "Hardhat",
  "0xaa36a7": "Sepolia",
};

type ConnectionProps = {
  children: ReactNode;
};

export const Connection: FC<ConnectionProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chain, setChain] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  useEffect(() => {
    initialize();

    window.ethereum.on("accountsChanged", initializeAgain);
    window.ethereum.on("chainChanged", initializeAgain);
  }, []);

  async function initialize() {
    const provider = new BrowserProvider(window.ethereum);

    setProvider(provider);

    if (provider) {
      const chainId: string = await window.ethereum.request({
        method: "eth_chainId",
      });

      setChain(CHAINS[chainId] ?? chainId);
    }
  }

  function initializeAgain() {
    setAccount(null);
    setChain(null);
    setProvider(null);

    initialize();
  }

  async function onClickConnect() {
    const accounts: string[] = await provider!.send("eth_requestAccounts", []);
    const account = accounts.length > 0 ? accounts[0] : null;

    setAccount(account);
  }

  if (!provider) {
    return (
      <div className="connection">
        <div className="connectionStatus">Initializing ...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="connection">
        Not connected.
        <button className="connectionButton" onClick={onClickConnect}>
          Connect to {chain}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="connection">
        <div className="connectionStatus">
          Connected to {chain} as {account}.
        </div>
      </div>
      {children}
    </>
  );
};

export default Connection;
