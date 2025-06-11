import { useEffect, useState } from "react";

import { createFhevmInstance, init } from "../fhevmjs";
import "./App.css";
import Connection from "./Connection";
import HomomorphicArithmeticForm from "./demo/HomomorphicArithmeticForm";
import HomomorphicEncryptionForm from "./demo/HomomorphicEncryptionForm";

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    await init();
    await createFhevmInstance();

    setInitialized(true);
  }

  if (initialized) {
    return (
      <>
        <Connection>
          <div className="content">
            <HomomorphicArithmeticForm />
            <HomomorphicEncryptionForm />
          </div>
        </Connection>
      </>
    );
  }
}

export default App;
