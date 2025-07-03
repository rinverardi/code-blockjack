// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./NaiveBlockjack.sol";

contract NaiveBlockjackForTests is NaiveBlockjack {
    mapping(address => uint8[]) _gameCards;

    function _randomCard(uint256 /* seed */) internal override returns (uint8) {
        uint8[] storage cards = _gameCards[msg.sender];

        uint8 card = cards[cards.length - 1];

        cards.pop();

        return card;
    }

    function plantCards(uint8[] memory cards) public {
        _gameCards[msg.sender] = cards;
    }
}
