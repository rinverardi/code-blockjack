import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomomorphicArithmeticForm from "./components/demo/homomorphic_arithmetic_form.tsx";
import HomomorphicEncryptionForm from "./components/demo/homomorphic_encryption_form.tsx";
import NaiveBlockjackForm from "./components/game/naive_blockjack_form.tsx";
import SecureBlockjackForm from "./components/game/secure_blockjack_form.tsx";
import Home from "./components/home.tsx";
import WalletConnection from "./components/wallet_connection.tsx";
import WalletDetection from "./components/wallet_detection.tsx";
import "./main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletDetection>
      <WalletConnection>
        <div id="content">
          <BrowserRouter>
            <Routes>
              <Route path="*" element={<Home />} />
              <Route path="/demo/arithmetic" element={<HomomorphicArithmeticForm />} />
              <Route path="/demo/encryption" element={<HomomorphicEncryptionForm />} />
              <Route path="/game/naive" element={<NaiveBlockjackForm />} />
              <Route path="/game/secure" element={<SecureBlockjackForm />} />
            </Routes>
          </BrowserRouter>
        </div>
        <div id="progress">
          <div id="progress__indicator" />
        </div>
      </WalletConnection>
    </WalletDetection>
  </React.StrictMode>,
);
