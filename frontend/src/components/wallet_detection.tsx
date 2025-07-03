import { FC, ReactNode, useEffect, useState } from "react";

import { init } from "../lib/fhevm/fhevmjs";

type WalletDetectionProps = {
  children: ReactNode;
};

export const WalletDetection: FC<WalletDetectionProps> = ({ children }) => {
  const [detected, setDetected] = useState<boolean | null>(null);
  const [initialized, setInitialized] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      setDetected(!!window.ethereum);

      await initialize();
    })().catch(console.error);
  }, []);

  async function initialize() {
    try {
      await init();

      setInitialized(true);
    } catch (_) {
      setInitialized(false);
    }
  }

  let status;

  if (!detected) {
    status = detected === null ? "Detecting your wallet ..." : "Cannot detect your wallet!";
  } else if (!initialized) {
    status = initialized === null ? "Initializing your wallet ..." : "Cannot initialize your wallet!";
  } else {
    return children;
  }

  return <div className="status">{status}</div>;
};

export default WalletDetection;
