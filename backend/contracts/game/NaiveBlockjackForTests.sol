// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./NaiveBlockjack.sol";

contract NaiveBlockjackForTests is NaiveBlockjack {
    function plantDeck(uint8[] memory deck) public {
        _games[msg.sender].deck = deck;
    }
}
