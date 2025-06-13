import type { NaiveBlockjack } from "@backend-types/contracts/game/NaiveBlockjack";
import { BrowserProvider, Contract } from "ethers";
import { useEffect, useState } from "react";

import { wrapContract } from "../../lib/chaos";
import { GameState } from "../../lib/game/game_state";
import { toggleProgress } from "../../lib/progress";

export const NaiveBlockjackForm = () => {
  const [contract, setContract] = useState<(Contract & NaiveBlockjack) | null>(null);
  const [game, setGame] = useState<NaiveBlockjack.GameStruct | null>(null);

  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    async function init() {
      const signer = await provider.getSigner();

      const deployment = await import(
        import.meta.env.MOCKED
          ? "@backend-deployments/localhost/NaiveBlockjack.json"
          : "@backend-deployments/sepolia/NaiveBlockjack.json"
      );

      const contract = new Contract(deployment.address, deployment.abi, signer) as Contract & NaiveBlockjack;

      setContract(wrapContract(contract, "NaiveBlockjack"));

      toggleProgress(false);
    }

    init();
  }, []);

  useEffect(() => {
    if (contract) {
      contract.on("StateChanged", () => {
        refreshGame();
      });

      refreshGame();
    }
  }, [contract]);

  function displayActions() {
    const gameState = Number(game?.state);

    switch (gameState) {
      case GameState.DealerWins:
      case GameState.PlayerWins:
      case GameState.Tie:
        return <button onClick={onClickDeleteGame}>Delete game</button>;

      case GameState.Uninitialized:
        return <button onClick={onClickCreateGame}>Create game</button>;

      case GameState.Waiting:
        return (
          <>
            <button onClick={onClickHit}>Hit</button>
            <button onClick={onClickStand}>Stand</button>
          </>
        );
    }
  }

  function displayState() {
    const gameState = Number(game?.state);

    switch (gameState) {
      case GameState.DealerWins:
        return <p>You lose.</p>;

      case GameState.PlayerWins:
        return <p>You win.</p>;

      case GameState.Tie:
        return <p>It's a tie.</p>;

      case GameState.Waiting:
        return <p>It's your turn.</p>;
    }
  }

  async function onClickCreateGame() {
    toggleProgress(true);

    try {
      const createGame = await contract!.createGame();
      await createGame.wait();
    } catch (error) {
      alert(error);
    }

    toggleProgress(false);
  }

  async function onClickDeleteGame() {
    toggleProgress(true);

    try {
      const deleteGame = await contract!.deleteGame();
      await deleteGame.wait();
    } catch (error) {
      alert(error);
    }

    toggleProgress(false);
  }

  async function onClickHit() {
    toggleProgress(true);

    try {
      const hit = await contract!.hit();
      await hit.wait();
    } catch (error) {
      alert(error);
    }

    toggleProgress(false);
  }

  async function onClickStand() {
    toggleProgress(true);

    try {
      const stand = await contract!.stand();
      await stand.wait();
    } catch (error) {
      alert(error);
    }

    toggleProgress(false);
  }

  async function refreshGame() {
    const game = await contract!.getGame();

    setGame(game);
  }

  return (
    <>
      <h1>Naive Blockjack</h1>
      {displayState()}
      {displayActions()}
    </>
  );
};

export default NaiveBlockjackForm;
