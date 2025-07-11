// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./NaiveBlockjack.sol";

contract NaiveBlockjackForMeasurements is NaiveBlockjack {
    function _randomCard(uint256 seed) internal override returns (uint8) {
        super._randomCard(seed);

        return 6;
    }
}
