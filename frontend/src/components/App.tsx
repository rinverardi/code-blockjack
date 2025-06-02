import { Connect } from './Connect';
import { Devnet } from './Devnet';
import { useEffect, useState } from 'react';
import { init } from '../fhevmjs';

function App() {
  const [isInitialized, setInitialized] = useState(false);

  useEffect(() => {
    init()
      .then(() => setInitialized(true))
      .catch(() => setInitialized(false));
  }, []);

  if (!isInitialized) return null;

  return (
    <>
      <h1>Confidential ERC20 dApp</h1>
      <Connect>
        {(account, provider, readOnlyProvider) => (
          <Devnet
            account={account}
            provider={provider}
            readOnlyProvider={readOnlyProvider}
          />
        )}
      </Connect>
    </>
  );
}

export default App;
