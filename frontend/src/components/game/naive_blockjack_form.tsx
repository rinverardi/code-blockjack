import type { NaiveBlockjack } from "@backend-types/contracts/game/NaiveBlockjack";
import { BrowserProvider, Contract } from "ethers";
import { Overrides } from "ethers";
import { useEffect, useState } from "react";

import { Progress, setProgress, setProgressUnlessIdle } from "../../lib/progress";
import Card from "./card";

enum State {
  Uninitialized,
  DealerBusts,
  DealerWins,
  PlayerBusts,
  PlayerWins,
  Tie,
  Waiting,
}

const NaiveBlockjackForm = () => {
  const [address, setAddress] = useState<string>();
  const [cardsForDealer, setCardsForDealer] = useState<number[]>();
  const [cardsForPlayer, setCardsForPlayer] = useState<number[]>();
  const [contract, setContract] = useState<Contract & NaiveBlockjack>();
  const [state, setState] = useState<State>();

  const overrides: Overrides = { gasLimit: 300_000 };
  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    (async () => {
      const signer = await provider.getSigner();

      setAddress(await signer.getAddress());

      const deployment = await import(
        import.meta.env.MOCKED
          ? "@backend-deployments/localhost/NaiveBlockjack.json"
          : "@backend-deployments/sepolia/NaiveBlockjack.json"
      );

      const contract = new Contract(deployment.address, deployment.abi, signer) as Contract & NaiveBlockjack;

      setContract(contract);

      const game = await contract.getGame();

      updateCardsForDealer(undefined, game.cardsForDealer);
      updateCardsForPlayer(undefined, game.cardsForPlayer);
      updateState(undefined, game.state);

      setProgress(Progress.Idle);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (contract) {
        contract.on(contract.filters.CardsChangedForDealer, updateCardsForDealer);
        contract.on(contract.filters.CardsChangedForPlayer, updateCardsForPlayer);
        contract.on(contract.filters.StateChanged, updateState);

        return () => {
          contract.off(contract.filters.CardsChangedForDealer, updateCardsForDealer);
          contract.off(contract.filters.CardsChangedForPlayer, updateCardsForPlayer);
          contract.off(contract.filters.StateChanged, updateState);
        };
      }
    })();
  }, [contract]);

  function displayActions() {
    if (isGameOver()) {
      return <button onClick={onClickDeleteGame}>Delete game</button>;
    } else if (state == State.Uninitialized) {
      return <button onClick={onClickCreateGame}>Create game</button>;
    } else if (state == State.Waiting) {
      return (
        <>
          <button onClick={onClickHit}>Hit</button>
          <button onClick={onClickStand}>Stand</button>
        </>
      );
    }
  }

  function displayCardsForDealer() {
    if (cardsForDealer?.length) {
      return (
        <>
          <h2>Dealer's Cards</h2>
          <div className="cards">
            {cardsForDealer.map((card, cardIndex) => (
              <Card card={card} cardIndex={cardIndex} concealed={cardIndex == 0 && !isGameOver()} revealable={false} />
            ))}
          </div>
        </>
      );
    }
  }

  function displayCardsForPlayer() {
    if (cardsForPlayer?.length) {
      return (
        <>
          <h2>Player's Cards</h2>
          <div className="cards">
            {cardsForPlayer.map((card, cardIndex) => (
              <Card card={card} cardIndex={cardIndex} concealed={false} revealable={false} />
            ))}
          </div>
        </>
      );
    }
  }

  function displayState() {
    switch (state) {
      case State.DealerBusts:
      case State.PlayerWins:
        return <p>You win.</p>;

      case State.DealerWins:
      case State.PlayerBusts:
        return <p>You lose.</p>;

      case State.Tie:
        return <p>It's a tie.</p>;

      case State.Waiting:
        return <p>Now it's your turn ...</p>;
    }
  }

  function isGameOver() {
    return (
      state == State.DealerBusts ||
      state == State.DealerWins ||
      state == State.PlayerBusts ||
      state == State.PlayerWins ||
      state == State.Tie
    );
  }

  async function onClickCreateGame() {
    setProgress(Progress.Sending);

    try {
      const createGame = await contract!.createGame(overrides);
      await createGame.wait();

      setProgressUnlessIdle(Progress.Receiving);
    } catch (error) {
      alert(error);

      setProgress(Progress.Idle);
    }
  }

  async function onClickDeleteGame() {
    setProgress(Progress.Sending);

    try {
      const deleteGame = await contract!.deleteGame(overrides);
      await deleteGame.wait();

      setProgressUnlessIdle(Progress.Receiving);
    } catch (error) {
      alert(error);

      setProgress(Progress.Idle);
    }
  }

  async function onClickHit() {
    setProgress(Progress.Sending);

    try {
      const hit = await contract!.hit(overrides);
      await hit.wait();

      setProgressUnlessIdle(Progress.Receiving);
    } catch (error) {
      alert(error);

      setProgress(Progress.Idle);
    }
  }

  async function onClickStand() {
    setProgress(Progress.Sending);

    try {
      const stand = await contract!.stand(overrides);
      await stand.wait();

      setProgressUnlessIdle(Progress.Receiving);
    } catch (error) {
      alert(error);

      setProgress(Progress.Idle);
    }
  }

  function updateCardsForDealer(game: string | undefined, cardsForDealer: bigint[]) {
    if (!game || game === address) {
      setCardsForDealer(cardsForDealer.map((card) => Number(card)));

      setProgress(Progress.Idle);
    }
  }

  function updateCardsForPlayer(game: string | undefined, cardsForPlayer: bigint[]) {
    if (!game || game === address) {
      setCardsForPlayer(cardsForPlayer.map((card) => Number(card)));

      setProgress(Progress.Idle);
    }
  }

  function updateState(game: string | undefined, state: bigint) {
    if (!game || game === address) {
      const stateValue = Number(state);

      if (stateValue === State.Uninitialized) {
        setCardsForDealer([]);
        setCardsForPlayer([]);
      }

      setState(stateValue);

      setProgress(Progress.Idle);
    }
  }

  return (
    <>
      <h1>Naive Blockjack</h1>
      {displayState()}
      {displayCardsForDealer()}
      {displayCardsForPlayer()}
      {displayActions()}
    </>
  );
};

export default NaiveBlockjackForm;
