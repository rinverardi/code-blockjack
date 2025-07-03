import type { SecureBlockjack } from "@backend-types/contracts/game/SecureBlockjack";
import { BrowserProvider, Contract, Overrides, Signer } from "ethers";
import { useEffect, useState } from "react";

import { getInstance } from "../../lib/fhevm/fhevmjs";
import { Progress, setProgress, setProgressUnlessIdle } from "../../lib/progress";
import Card from "./card";

enum State {
  Uninitialized,
  Checking,
  DealerBusts,
  DealerWins,
  PlayerBusts,
  PlayerWins,
  Tie,
  WaitingForDealer,
  WaitingForPlayer,
}

const SecureBlockjackForm = () => {
  const [cardsForDealer, setCardsForDealer] = useState<bigint[]>();
  const [cardsForPlayer, setCardsForPlayer] = useState<bigint[]>();
  const [contract, setContract] = useState<Contract & SecureBlockjack>();
  const [contractAddress, setContractAddress] = useState<string>();
  const [signer, setSigner] = useState<Signer>();
  const [signerAddress, setSignerAddress] = useState<string>();
  const [state, setState] = useState<State>();
  const [values, setValues] = useState<Map<bigint, number>>(new Map());

  const overrides: Overrides = { gasLimit: 2_000_000 };
  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    (async () => {
      const signer = await provider.getSigner();

      setSigner(signer);
      setSignerAddress(await signer.getAddress());

      const deployment = await import(
        import.meta.env.MOCKED
          ? "@backend-deployments/localhost/SecureBlockjack.json"
          : "@backend-deployments/sepolia/SecureBlockjack.json"
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const contract = new Contract(deployment.address, deployment.abi, signer) as Contract & SecureBlockjack;

      setContract(contract);
      setContractAddress(await contract.getAddress());

      const game = await contract.getGame();

      updateCardsForDealer(undefined, game.cardsForDealer);
      updateCardsForPlayer(undefined, game.cardsForPlayer);
      updateState(undefined, game.state);

      setProgress(Progress.Idle);
    })().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (contract) {
      contract.on(contract.filters.CardsChangedForDealer, updateCardsForDealer).catch(console.error);
      contract.on(contract.filters.CardsChangedForPlayer, updateCardsForPlayer).catch(console.error);
      contract.on(contract.filters.StateChanged, updateState).catch(console.error);

      return () => {
        contract.off(contract.filters.CardsChangedForDealer, updateCardsForDealer).catch(console.error);
        contract.off(contract.filters.CardsChangedForPlayer, updateCardsForPlayer).catch(console.error);
        contract.off(contract.filters.StateChanged, updateState).catch(console.error);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  async function decryptCard(card: bigint) {
    setProgress(Progress.Receiving);

    try {
      const { publicKey, privateKey } = getInstance().generateKeypair();

      const signatureData = getInstance().createEIP712(publicKey, await contract!.getAddress());

      const signature = await signer!.signTypedData(
        signatureData.domain,
        { Reencrypt: signatureData.types.Reencrypt },
        signatureData.message,
      );

      const value = await getInstance().reencrypt(
        card,
        privateKey,
        publicKey,
        signature.replace("0x", ""),
        contractAddress!,
        signerAddress!,
      );

      setValues((oldValues) => {
        const newValues = new Map(oldValues);

        newValues.set(card, Number(value));

        return newValues;
      });
    } catch (error) {
      console.error(error);
    }

    setProgress(Progress.Idle);
  }

  function displayActions() {
    if (isGameOver()) {
      return <button onClick={onClickDeleteGame}>Delete game</button>;
    } else if (state == State.Uninitialized) {
      return <button onClick={onClickCreateGame}>Create game</button>;
    } else if (state == State.WaitingForDealer) {
      return <button onClick={onClickHitAsDealer}>Continue game</button>;
    } else if (state == State.WaitingForPlayer) {
      return (
        <>
          <button onClick={onClickHitAsPlayer}>Hit</button>
          <button onClick={onClickStand}>Stand</button>
        </>
      );
    }
  }

  function displayCard(card: bigint, cardIndex: number, revealable: boolean) {
    const value = values && values.get(card);

    if (value) {
      return <Card card={value} cardIndex={cardIndex} concealed={false} revealable={false} />;
    } else {
      return (
        <Card
          card={0}
          cardIndex={cardIndex}
          concealed={true}
          onClick={revealable ? () => onClickReveal(card) : undefined}
          revealable={revealable}
        />
      );
    }
  }

  function displayCardsForDealer() {
    if (cardsForDealer?.length) {
      const cards = cardsForDealer.map((card, cardIndex) =>
        displayCard(card, cardIndex, cardIndex > 0 || isGameOver()),
      );

      return (
        <>
          <h2>Dealer's Cards</h2>
          <div className="cards">{cards}</div>
        </>
      );
    }
  }

  function displayCardsForPlayer() {
    if (cardsForPlayer?.length) {
      const cards = cardsForPlayer.map((card, cardIndex) => displayCard(card, cardIndex, true));

      return (
        <>
          <h2>Player's Cards</h2>
          <div className="cards">{cards}</div>
        </>
      );
    }
  }

  function displayState() {
    switch (state) {
      case State.Checking:
        return <p>Checking ...</p>;

      case State.DealerBusts:
      case State.PlayerWins:
        return <p>You win.</p>;

      case State.DealerWins:
      case State.PlayerBusts:
        return <p>You lose.</p>;

      case State.Tie:
        return <p>It's a tie.</p>;

      case State.WaitingForDealer:
        return <p>Now it's the dealers turn ...</p>;

      case State.WaitingForPlayer:
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
      console.error(error);

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
      console.error(error);

      setProgress(Progress.Idle);
    }
  }

  async function onClickHitAsDealer() {
    setProgress(Progress.Sending);

    try {
      const hitAsDealer = await contract!.hitAsDealer(overrides);
      await hitAsDealer.wait();

      setProgressUnlessIdle(Progress.Receiving);
    } catch (error) {
      console.error(error);

      setProgress(Progress.Idle);
    }
  }

  async function onClickHitAsPlayer() {
    setProgress(Progress.Sending);

    try {
      const hitAsPlayer = await contract!.hitAsPlayer(overrides);
      await hitAsPlayer.wait();

      setProgressUnlessIdle(Progress.Receiving);
    } catch (error) {
      console.error(error);

      setProgress(Progress.Idle);
    }
  }

  async function onClickReveal(card: bigint) {
    await decryptCard(card);
  }

  async function onClickStand() {
    setProgress(Progress.Sending);

    try {
      const stand = await contract!.stand(overrides);
      await stand.wait();

      setProgressUnlessIdle(Progress.Receiving);
    } catch (error) {
      console.error(error);

      setProgress(Progress.Idle);
    }
  }

  function updateCardsForDealer(game: string | undefined, cardsForDealer: bigint[]) {
    if (!game || game === signerAddress) {
      setCardsForDealer(cardsForDealer);

      setProgress(Progress.Idle);
    }
  }

  function updateCardsForPlayer(game: string | undefined, cardsForPlayer: bigint[]) {
    if (!game || game === signerAddress) {
      setCardsForPlayer(cardsForPlayer);

      setProgress(Progress.Idle);
    }
  }

  function updateState(game: string | undefined, state: bigint) {
    if (!game || game === signerAddress) {
      const stateValue = Number(state);

      if (stateValue === Number(State.Uninitialized)) {
        setCardsForDealer([]);
        setCardsForPlayer([]);
      }

      setState(stateValue);

      setProgress(Progress.Idle);
    }
  }

  return (
    <>
      <h1>Secure Blockjack</h1>
      {displayState()}
      {displayCardsForDealer()}
      {displayCardsForPlayer()}
      {displayActions()}
    </>
  );
};

export default SecureBlockjackForm;
