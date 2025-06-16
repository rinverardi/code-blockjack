import type { NaiveBlockjack } from "@backend-types/contracts/game/NaiveBlockjack";
import { BigNumberish, BrowserProvider, Contract } from "ethers";
import { useEffect, useState } from "react";

import { GameState } from "../../lib/game/game_state";
import { Progress, setProgress } from "../../lib/progress";
import Card from "./card";

const NaiveBlockjackForm = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [cardsForDealer, setCardsForDealer] = useState<number[] | null>(null);
  const [cardsForPlayer, setCardsForPlayer] = useState<number[] | null>(null);
  const [contract, setContract] = useState<(Contract & NaiveBlockjack) | null>(null);
  const [state, setState] = useState<GameState | null>(null);

  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    async function init() {
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      setAddress(signerAddress);

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
    }

    init();
  }, []);

  useEffect(() => {
    async function init() {
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
    }

    init();
  }, [contract]);

  function displayActions() {
    if (isGameOver()) {
      return <button onClick={onClickDeleteGame}>Delete game</button>;
    } else if (state == GameState.Uninitialized) {
      return <button onClick={onClickCreateGame}>Create game</button>;
    } else if (state == GameState.Waiting) {
      return (
        <>
          <button onClick={onClickHit}>Hit</button>
          <button onClick={onClickStand}>Stand</button>
        </>
      );
    }
  }

  function displayCards(cards: number[], concealed: boolean) {
    return (
      <div className="cards">
        {cards.map((card, cardIndex) => (
          <Card card={card} cardIndex={cardIndex} concealed={cardIndex == 0 && concealed} />
        ))}
      </div>
    );
  }

  function displayCardsForDealer() {
    if (cardsForDealer?.length) {
      return (
        <>
          <h2>Dealer's Cards</h2>
          {displayCards(cardsForDealer, !isGameOver())}
        </>
      );
    }
  }

  function displayCardsForPlayer() {
    if (cardsForPlayer?.length) {
      return (
        <>
          <h2>Player's Cards</h2>
          {displayCards(cardsForPlayer, false)}
        </>
      );
    }
  }

  function displayState() {
    switch (state) {
      case GameState.DealerBusts:
      case GameState.PlayerWins:
        return <p>You win.</p>;

      case GameState.DealerWins:
      case GameState.PlayerBusts:
        return <p>You lose.</p>;

      case GameState.Tie:
        return <p>It's a tie.</p>;

      case GameState.Waiting:
        return <p>It's your turn.</p>;
    }
  }

  function isGameOver() {
    return (
      state == GameState.DealerBusts ||
      state == GameState.DealerWins ||
      state == GameState.PlayerBusts ||
      state == GameState.PlayerWins ||
      state == GameState.Tie
    );
  }

  async function onClickCreateGame() {
    setProgress(Progress.Sending);

    try {
      const createGame = await contract!.createGame({ gasLimit: 500_000 });
      await createGame.wait();

      setProgress(Progress.Receiving);
    } catch (error) {
      alert(error);

      setProgress(Progress.Idle);
    }
  }

  async function onClickDeleteGame() {
    setProgress(Progress.Sending);

    try {
      const deleteGame = await contract!.deleteGame();
      await deleteGame.wait();

      setProgress(Progress.Receiving);
    } catch (error) {
      alert(error);

      setProgress(Progress.Idle);
    }
  }

  async function onClickHit() {
    setProgress(Progress.Sending);

    try {
      const hit = await contract!.hit({ gasLimit: 500_000 });
      await hit.wait();

      setProgress(Progress.Receiving);
    } catch (error) {
      alert(error);

      setProgress(Progress.Idle);
    }
  }

  async function onClickStand() {
    setProgress(Progress.Sending);

    try {
      const stand = await contract!.stand({ gasLimit: 500_000 });
      await stand.wait();

      setProgress(Progress.Receiving);
    } catch (error) {
      alert(error);

      setProgress(Progress.Idle);
    }
  }

  function updateCardsForDealer(game: string | undefined, cardsForDealer: BigNumberish[]) {
    if (!game || game === address) {
      setCardsForDealer(cardsForDealer.map((card) => Number(card)));

      setProgress(Progress.Idle);
    }
  }

  function updateCardsForPlayer(game: string | undefined, cardsForPlayer: BigNumberish[]) {
    if (!game || game === address) {
      setCardsForPlayer(cardsForPlayer.map((card) => Number(card)));

      setProgress(Progress.Idle);
    }
  }

  function updateState(game: string | undefined, state: BigNumberish) {
    if (!game || game === address) {
      const stateValue = Number(state);

      if (stateValue === GameState.Uninitialized) {
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
