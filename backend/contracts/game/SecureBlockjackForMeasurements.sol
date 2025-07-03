// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./SecureBlockjack.sol";

contract SecureBlockjackForMeasurements is SecureBlockjack {
    function _randomCard(bool revealable) internal override returns (euint8) {
        super._randomCard(revealable);

        euint8 card = _encryptPoints(6);

        TFHE.allowThis(card);

        if (revealable) {
            TFHE.allow(card, msg.sender);
        }

        return card;
    }
}
