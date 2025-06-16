import { FC } from "react";

function deriveRank(card: number) {
  switch (card) {
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    case 14:
      return "A";
    default:
      return card.toString();
  }
}

function deriveSuit(card: number, cardIndex: number): [string, string] {
  switch ((card + cardIndex) % 4) {
    case 0x00:
      return ["♥", "red"];
    case 0x01:
      return ["♦", "blue"];
    case 0x02:
      return ["♣", "green"];
    default:
      return ["♠", "black"];
  }
}

function makeFigures(rank: string, suit: string) {
  const rankValue = Number(rank);

  if (isNaN(rankValue)) {
    return (
      <div className="card__figure--1">
        <span>{rank == "A" ? suit : rank}</span>
      </div>
    );
  } else {
    const suits = [];

    for (let index = 0; index < rankValue; index++) {
      suits.push(<span key={index}>{suit}</span>);
    }

    return <div className="card__figure--n">{suits}</div>;
  }
}

const Card: FC<CardProps> = ({ card, cardIndex }) => {
  const rank = deriveRank(card);
  const [suit, suitColor] = deriveSuit(card, cardIndex);

  return (
    <div className={`card suit--${suitColor}`}>
      <div className="card__index">
        <span>{rank}</span>
        <br />
        <span>{suit}</span>
      </div>
      <div className="card__index card__index--bottom">
        <span>{rank}</span>
        <br />
        <span>{suit}</span>
      </div>
      {makeFigures(rank, suit)}
    </div>
  );
};

type CardProps = {
  card: number;
  cardIndex: number;
};

export default Card;
