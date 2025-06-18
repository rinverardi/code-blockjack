// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

contract NaiveBlockjack {
    struct Game {
        uint8[] cardsForDealer;
        uint8[] cardsForPlayer;
        uint8[] deck;
        State state;
    }

    enum State {
        Uninitialized,
        DealerBusts,
        DealerWins,
        PlayerBusts,
        PlayerWins,
        Tie,
        Waiting
    }

    event CardsChangedForDealer(address indexed game, uint8[] cards);
    event CardsChangedForPlayer(address indexed game, uint8[] cards);
    event StateChanged(address indexed game, State state);

    mapping(address => Game) _games;
    uint256 _seed;

    function createGame() public {
        Game storage game = _games[msg.sender];

        require(game.state == State.Uninitialized, "Illegal state");

        _dealPlayer(game, 2);

        uint8 pointsForPlayer = _rateCards(game.cardsForPlayer);

        if (pointsForPlayer >= 21) {
            _setState(game, pointsForPlayer == 21 ? State.PlayerWins : State.PlayerBusts);
            return;
        }

        _dealDealer(game, 2);

        uint8 pointsForDealer = _rateCards(game.cardsForDealer);

        if (pointsForDealer >= 21) {
            _setState(game, pointsForDealer == 21 ? State.DealerWins : State.DealerBusts);
            return;
        }

        _setState(game, State.Waiting);
    }

    function _dealDealer(Game storage game, uint8 count) private {
        for (; count > 0; count--) {
            if (game.deck.length > 0) {
                game.cardsForDealer.push(game.deck[game.deck.length - 1]);
                game.deck.pop();
            } else {
                game.cardsForDealer.push(_randomCard(_seed++));
            }
        }

        emit CardsChangedForDealer(msg.sender, game.cardsForDealer);
    }

    function _dealPlayer(Game storage game, uint8 count) private {
        for (; count > 0; count--) {
            if (game.deck.length > 0) {
                game.cardsForPlayer.push(game.deck[game.deck.length - 1]);
                game.deck.pop();
            } else {
                game.cardsForPlayer.push(_randomCard(_seed++));
            }
        }

        emit CardsChangedForPlayer(msg.sender, game.cardsForPlayer);
    }

    function deleteGame() public {
        delete _games[msg.sender];

        emit StateChanged(msg.sender, State.Uninitialized);
    }

    function getGame() public view returns (Game memory) {
        return _games[msg.sender];
    }

    function hit() public {
        Game storage game = _games[msg.sender];

        require(game.state == State.Waiting, "Illegal state");

        _dealPlayer(game, 1);
        _setState(game, _rateCards(game.cardsForPlayer) > 21 ? State.PlayerBusts : State.Waiting);
    }

    function _randomCard(uint256 seed) private view returns (uint8) {
        uint256 value = uint256(keccak256(abi.encodePacked(seed, block.timestamp, block.prevrandao, msg.sender)));

        return uint8((value % 13) + 2);
    }

    function _rateCard(uint8 card) private pure returns (uint8) {
        if (card < 11) {
            return card;
        } else if (card < 14) {
            return 10;
        } else {
            return 11;
        }
    }

    function _rateCards(uint8[] memory cards) private pure returns (uint8) {
        uint8 total;

        for (uint8 index = 0; index < cards.length; index++) {
            total += _rateCard(cards[index]);
        }

        return total;
    }

    function _setState(Game storage game, State state) private {
        game.state = state;

        emit StateChanged(msg.sender, state);
    }

    function stand() public {
        Game storage game = _games[msg.sender];

        require(game.state == State.Waiting, "Illegal state");

        while (_rateCards(game.cardsForDealer) < 17) {
            _dealDealer(game, 1);
        }

        uint8 pointsForDealer = _rateCards(game.cardsForDealer);

        if (pointsForDealer > 21) {
            _setState(game, State.DealerBusts);
            return;
        }

        uint8 pointsForPlayer = _rateCards(game.cardsForPlayer);

        if (pointsForPlayer > pointsForDealer) {
            _setState(game, State.PlayerWins);
        } else if (pointsForPlayer < pointsForDealer) {
            _setState(game, State.DealerWins);
        } else {
            _setState(game, State.Tie);
        }
    }
}
