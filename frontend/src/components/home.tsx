import { useEffect } from "react";

import { Progress, setProgress } from "../lib/progress";
import { Link } from "react-router-dom";

const Home = () => {
  useEffect(() => {
    setProgress(Progress.Idle);
  });

  return (
    <>
      <h1>Games</h1>
      <ul>
        <li>
          <Link to="/game/naive">Naive Blockjack</Link>
        </li>
        <li>
          <Link to="/game/secure">Secure Blockjack</Link>
        </li>
      </ul>
      <h1>Demos</h1>
      <ul>
        <li>
          <Link to="/demo/arithmetic">Homomorphic Arithmetic</Link>
        </li>
        <li>
          <Link to="/demo/encryption">Homomorphic Encryption</Link>
        </li>
      </ul>
    </>
  );
};

export default Home;
