import { Connect } from './Connect';
import { useEffect, useState } from 'react';
import { init } from '../fhevmjs';

import HomomorphicEncryptionForm from "./demo/HomomorphicEncryptionForm";

function App() {
  const [isInitialized, setInitialized] = useState(false);

  useEffect(() => {
    init()
      .then(() => setInitialized(true))
      .catch(() => setInitialized(false));
  }, []);

  if (!isInitialized) return <p>Not initialized</p>;

  return (
    <>
      <Connect>
        {(_, provider) => <HomomorphicEncryptionForm provider={provider} />}
      </Connect>
    </>
  );
}

export default App;
