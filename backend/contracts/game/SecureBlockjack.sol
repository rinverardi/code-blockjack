// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "fhevm/config/ZamaFHEVMConfig.sol";
import "fhevm/config/ZamaGatewayConfig.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "fhevm/lib/TFHE.sol";

contract SecureBlockjack is GatewayCaller, SepoliaZamaFHEVMConfig, SepoliaZamaGatewayConfig {
    struct Game {
        euint8[] cardsForDealer;
        euint8[] cardsForPlayer;
        euint8[] deck;
        State state;
    }

    enum State {
        Uninitialized,
        Checking,
        DealerBusts,
        DealerWins,
        PlayerBusts,
        PlayerWins,
        Tie,
        WaitingForDealer,
        WaitingForPlayer
    }

    event CardsChangedForDealer(address indexed game, euint8[] cards);
    event CardsChangedForPlayer(address indexed game, euint8[] cards);
    event StateChanged(address indexed game, State state);

    mapping(uint256 => address) _gameAddresses;
    mapping(address => Game) _gameStructs;

    function _checkDealer(Game storage game) private {
        euint8 pointsForDealer = _rateCards(game.cardsForDealer);
        euint8 pointsForPlayer = _rateCards(game.cardsForPlayer);

        euint8 state = TFHE.select(
            TFHE.lt(pointsForDealer, 17),
            _encryptState(State.WaitingForDealer),
            TFHE.select(
                TFHE.gt(pointsForDealer, 21),
                _encryptState(State.DealerBusts),
                _gameOver(pointsForDealer, pointsForPlayer)
            )
        );

        _decryptState(state);
        _setState(game, msg.sender, State.Checking);
    }

    function _checkDealerAndPlayer(Game storage game) private {
        euint8 pointsForPlayer = _rateCards(game.cardsForPlayer);
        euint8 pointsForDealer = _rateCards(game.cardsForDealer);

        euint8 state = TFHE.select(
            TFHE.eq(pointsForPlayer, 21),
            _encryptState(State.PlayerWins),
            TFHE.select(
                TFHE.gt(pointsForPlayer, 21),
                _encryptState(State.PlayerBusts),
                TFHE.select(
                    TFHE.eq(pointsForDealer, 21),
                    _encryptState(State.DealerWins),
                    TFHE.select(
                        TFHE.gt(pointsForDealer, 21),
                        _encryptState(State.DealerBusts),
                        _encryptState(State.WaitingForPlayer)
                    )
                )
            )
        );

        _decryptState(state);
        _setState(game, msg.sender, State.Checking);
    }

    function _checkPlayer(Game storage game) private {
        euint8 pointsForPlayer = _rateCards(game.cardsForPlayer);

        euint8 state = TFHE.select(
            TFHE.gt(pointsForPlayer, 21),
            _encryptState(State.PlayerBusts),
            _encryptState(State.WaitingForPlayer)
        );

        _decryptState(state);
        _setState(game, msg.sender, State.Checking);
    }

    function continueGame() public {
        Game storage game = _gameStructs[msg.sender];

        require(game.state == State.WaitingForDealer, "Illegal state");

        _dealDealer(game, 1);
        _checkDealer(game);
    }

    function createGame() public {
        Game storage game = _gameStructs[msg.sender];

        require(game.state == State.Uninitialized, "Illegal state");

        _dealPlayer(game, 2);
        _dealDealer(game, 2);
        _checkDealerAndPlayer(game);
    }

    function _dealDealer(Game storage game, uint8 count) private {
        for (; count > 0; count--) {
            if (game.deck.length > 0) {
                game.cardsForDealer.push(game.deck[game.deck.length - 1]);
                game.deck.pop();
            } else {
                game.cardsForDealer.push(_randomCard(game.cardsForDealer.length > 0));
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
                game.cardsForPlayer.push(_randomCard(true));
            }
        }

        emit CardsChangedForPlayer(msg.sender, game.cardsForPlayer);
    }

    function _decryptState(euint8 state) private {
        uint256[] memory handles = new uint256[](1);

        handles[0] = Gateway.toUint256(state);

        uint256 requestId = Gateway.requestDecryption(
            handles,
            this._decryptStateDone.selector,
            0,
            block.timestamp + 100,
            false
        );

        _gameAddresses[requestId] = msg.sender;
    }

    function _decryptStateDone(uint256 requestId, uint8 state) public onlyGateway {
        address gameAddress = _gameAddresses[requestId];

        Game storage game = _gameStructs[gameAddress];

        _setState(game, gameAddress, State(state));
    }

    function deleteGame() public {
        delete _gameStructs[msg.sender];

        emit StateChanged(msg.sender, State.Uninitialized);
    }

    function _encryptPoints(uint8 points) private returns (euint8) {
        euint8 result = TFHE.asEuint8(points);

        TFHE.allowThis(result);

        return result;
    }

    function _encryptState(State state) private returns (euint8) {
        euint8 result = TFHE.asEuint8(uint8(state));

        TFHE.allowThis(result);

        return result;
    }

    function _gameOver(euint8 pointsForDealer, euint8 pointsForPlayer) private returns (euint8) {
        return
            TFHE.select(
                TFHE.gt(pointsForDealer, pointsForPlayer),
                _encryptState(State.DealerWins),
                TFHE.select(
                    TFHE.lt(pointsForDealer, pointsForPlayer),
                    _encryptState(State.PlayerWins),
                    _encryptState(State.Tie)
                )
            );
    }

    function getGame() public view returns (Game memory) {
        return _gameStructs[msg.sender];
    }

    function hitAsDealer() public {
        Game storage game = _gameStructs[msg.sender];

        require(game.state == State.WaitingForDealer, "Illegal state");

        _dealDealer(game, 1);
        _checkDealer(game);
    }

    function hitAsPlayer() public {
        Game storage game = _gameStructs[msg.sender];

        require(game.state == State.WaitingForPlayer, "Illegal state");

        _dealPlayer(game, 1);
        _checkPlayer(game);
    }

    function _isGameOver(State state) private pure returns (bool) {
        return
            state == State.DealerBusts ||
            state == State.DealerWins ||
            state == State.PlayerBusts ||
            state == State.PlayerWins ||
            state == State.Tie;
    }

    function _randomCard(bool revealable) private returns (euint8) {
        euint8 card = TFHE.add(TFHE.rem(TFHE.randEuint8(), 13), _encryptPoints(2));

        TFHE.allowThis(card);

        if (revealable) {
            TFHE.allow(card, msg.sender);
        }

        return card;
    }

    function _rateCard(euint8 card) private returns (euint8) {
        return
            TFHE.select(
                TFHE.lt(card, 11),
                card,
                TFHE.select(TFHE.lt(card, 14), _encryptPoints(10), _encryptPoints(11))
            );
    }

    function _rateCards(euint8[] memory cards) private returns (euint8) {
        euint8 total = TFHE.asEuint8(0);

        for (uint8 index = 0; index < cards.length; index++) {
            total = TFHE.add(total, _rateCard(cards[index]));
        }

        return total;
    }

    function _setState(Game storage game, address gameAddress, State state) private {
        game.state = state;

        if (_isGameOver(state)) {
            TFHE.allow(game.cardsForDealer[0], gameAddress);
        }

        emit StateChanged(gameAddress, state);
    }

    function stand() public {
        Game storage game = _gameStructs[msg.sender];

        require(game.state == State.WaitingForPlayer, "Illegal state");

        _checkDealer(game);
    }
}
