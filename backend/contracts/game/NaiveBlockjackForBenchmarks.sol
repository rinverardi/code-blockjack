// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./NaiveBlockjack.sol";

contract NaiveBlockjackForBenchmarks is NaiveBlockjack {
    function _randomCard(uint seed) internal override returns (uint8) {
        super._randomCard(seed);

        return 6;
    }
}
