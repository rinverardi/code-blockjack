// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./SecureBlockjack.sol";

contract SecureBlockjackForTests is SecureBlockjack {
    mapping(address => euint8[]) _gameCards;

    function _randomCard(bool revealable) internal override returns (euint8) {
        euint8[] storage cards = _gameCards[msg.sender];

        euint8 card = cards[cards.length - 1];

        TFHE.allowThis(card);

        if (revealable) {
            TFHE.allow(card, msg.sender);
        }

        cards.pop();

        return card;
    }

    function plantCards(uint8[] memory cards) public {
        for (uint256 index = 0; index < cards.length; ++index) {
            euint8 card = TFHE.asEuint8(cards[index]);

            _gameCards[msg.sender].push(card);

            TFHE.allowThis(card);
        }
    }
}
