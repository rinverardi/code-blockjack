// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./SecureBlockjack.sol";

contract SecureBlockjackForTesting is SecureBlockjack {
    function plantDeck(uint8[] memory deck) public {
        for (uint256 deckIndex = 0; deckIndex < deck.length; deckIndex++) {
            euint8 card = TFHE.asEuint8(deck[deckIndex]);

            _gameStructs[msg.sender].deck.push(card);

            TFHE.allowThis(card);
        }
    }
}
