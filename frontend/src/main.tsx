import React from "react";
import ReactDOM from "react-dom/client";

import WalletConnection from "./components/WalletConnection.tsx";
import WalletDetection from "./components/WalletDetection.tsx";
import HomomorphicArithmeticForm from "./components/demo/HomomorphicArithmeticForm.tsx";
import HomomorphicEncryptionForm from "./components/demo/HomomorphicEncryptionForm.tsx";
import "./main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletDetection>
      <WalletConnection>
        <div className="content">
          <HomomorphicArithmeticForm />
          <HomomorphicEncryptionForm />
        </div>
      </WalletConnection>
    </WalletDetection>
  </React.StrictMode>,
);
