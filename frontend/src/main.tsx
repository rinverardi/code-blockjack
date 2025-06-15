import React from "react";
import ReactDOM from "react-dom/client";

import WalletConnection from "./components/WalletConnection.tsx";
import WalletDetection from "./components/WalletDetection.tsx";
import NaiveBlockjackForm from "./components/game/NaiveBlockjackForm.tsx";
import "./main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletDetection>
      <WalletConnection>
        <div id="content">
          <NaiveBlockjackForm />
          {/*
          <HomomorphicArithmeticForm />
          <HomomorphicEncryptionForm />
          */}
        </div>
        <div id="progress">
          <div id="progress__indicator" />
        </div>
      </WalletConnection>
    </WalletDetection>
  </React.StrictMode>,
);
