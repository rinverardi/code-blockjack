import type { NaiveBlockjack } from "@backend-types/contracts/game/NaiveBlockjack";
import { BigNumberish, BrowserProvider, Contract } from "ethers";
import { useEffect, useState } from "react";

import { wrapContract } from "../../lib/chaos";
import { toggleProgress } from "../../lib/progress";
import { GameState } from "../../lib/game/game_state";

const NaiveBlockjackForm = () => {
  const [cardsForDealer, setCardsForDealer] = useState<number[] | null>(null);
  const [cardsForPlayer, setCardsForPlayer] = useState<number[] | null>(null);
  const [contract, setContract] = useState<(Contract & NaiveBlockjack) | null>(null);
  const [state, setState] = useState<GameState | null>(null);

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

      const game = await contract.getGame();

      updateCardsForDealer(undefined, game.cardsForDealer);
      updateCardsForPlayer(undefined, game.cardsForPlayer);
      updateState(undefined, game.state);

      toggleProgress(false);
    }

    init();
  }, []);

  useEffect(() => {
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
  }, [contract]);

  function displayActions() {
    if (state == GameState.DealerWins || state == GameState.PlayerWins || state == GameState.Tie) {
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

  function displayCard(card: number) {
    if (card < 11) {
      return card;
    } else if (card < 14) {
      return 10;
    } else {
      return 11;
    }
  }

  function displayCards(cards: number[]) {
    return (
      <p>
        {cards.map((card, cardIndex) => (
          <>
            {cardIndex > 0 && ", "}
            {displayCard(card)}
          </>
        ))}
      </p>
    );
  }

  function displayCardsForDealer() {
    if (cardsForDealer?.length) {
      return (
        <>
          <h2>Dealer's Cards</h2>
          {displayCards(cardsForDealer)}
        </>
      );
    }
  }

  function displayCardsForPlayer() {
    if (cardsForPlayer?.length) {
      return (
        <>
          <h2>Player's Cards</h2>
          {displayCards(cardsForPlayer)}
        </>
      );
    }
  }

  function displayState() {
    switch (state) {
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
      const createGame = await contract!.createGame({ gasLimit: 250_000 });
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

  function updateCardsForDealer(_: string | undefined, cardsForDealer: BigNumberish[]) {
    setCardsForDealer(cardsForDealer.map((card) => Number(card)));
  }

  function updateCardsForPlayer(_: string | undefined, cardsForPlayer: BigNumberish[]) {
    setCardsForPlayer(cardsForPlayer.map((card) => Number(card)));
  }

  function updateState(_: string | undefined, state: BigNumberish) {
    const stateValue = Number(state);

    if (stateValue === GameState.Uninitialized) {
      setCardsForDealer([]);
      setCardsForPlayer([]);
    }

    setState(stateValue);
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
