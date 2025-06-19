import { useEffect } from "react";

import { Progress, setProgress } from "../../lib/progress";

const SecureBlockjackForm = () => {
  useEffect(() => {
    setProgress(Progress.Idle);
  });

  return (
    <>
      <h1>Secure Blockjack</h1>
    </>
  );
};

export default SecureBlockjackForm;
