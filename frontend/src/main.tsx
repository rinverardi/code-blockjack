import React from "react";
import ReactDOM from "react-dom/client";

import NaiveBlockjackForm from "./components/game/naive_blockjack_form.tsx";
import WalletConnection from "./components/wallet_connection.tsx";
import WalletDetection from "./components/wallet_detection.tsx";
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
