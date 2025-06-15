import type { NaiveBlockjack } from "@backend-types/contracts/game/NaiveBlockjack";
import { BigNumberish, BrowserProvider, Contract } from "ethers";
import { useEffect, useState } from "react";

import { wrapContract } from "../../lib/Chaos";
import { toggleProgress } from "../../lib/Progress";
import { GameState } from "../../lib/game/GameState";

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
      setGame(await contract.getGame());

      toggleProgress(false);
    }

    init();
  }, []);

  useEffect(() => {
    if (contract) {
      const updateCardsForDealer = (_: string, cardsForDealer: BigNumberish[]) => {
        setGame((game) => game && { ...game, cardsForDealer });
      };

      const updateCardsForPlayer = (_: string, cardsForPlayer: BigNumberish[]) => {
        setGame((game) => game && { ...game, cardsForPlayer });
      };

      const updateState = (_: string, state: BigNumberish) => {
        if (state == GameState.Uninitialized) {
          setGame((game) => game && { ...game, cardsForDealer: [], cardsForPlayer: [], state });
        } else {
          setGame((game) => game && { ...game, state });
        }
      };

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
    const state = game?.state;

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

  function displayCards(cards: BigNumberish[]) {
    return cards.map((card, cardIndex) => {
      const cardValue = Number(card);

      return (
        <>
          {cardIndex > 0 && ", "}
          {displayCard(cardValue)}
        </>
      );
    });
  }

  function displayCardsForDealer() {
    const cards = game?.cardsForDealer;

    if (cards?.length) {
      return (
        <>
          <h2>Dealer's Cards</h2>
          {displayCards(cards)}
        </>
      );
    }
  }

  function displayCardsForPlayer() {
    const cards = game?.cardsForPlayer;

    if (cards?.length) {
      return (
        <>
          <h2>Player's Cards</h2>
          <p>{displayCards(cards)}</p>
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
