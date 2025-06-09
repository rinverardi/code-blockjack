// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "fhevm/config/ZamaFHEVMConfig.sol";
import "fhevm/config/ZamaGatewayConfig.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "fhevm/lib/TFHE.sol";

contract HomomorphicEncryption is GatewayCaller, SepoliaZamaFHEVMConfig, SepoliaZamaGatewayConfig {
    euint8 _handle;
    uint8 _value;

    function decryptValue() public {
        uint256[] memory handles = new uint256[](1);

        handles[0] = Gateway.toUint256(_handle);

        Gateway.requestDecryption(handles, this.decryptValueDone.selector, 0, block.timestamp + 100, false);
    }

    function decryptValueDone(uint256, uint8 value) public onlyGateway {
        _value = value;
    }

    function encryptValue(uint8 value) public {
        _handle = TFHE.asEuint8(value);

        TFHE.allow(_handle, msg.sender);
        TFHE.allowThis(_handle);
    }

    function getHandle() public view returns (euint8) {
        return _handle;
    }

    function getValue() public view returns (uint8) {
        return _value;
    }

    function setValue(einput input, bytes calldata inputProof) public {
        _handle = TFHE.asEuint8(input, inputProof);

        TFHE.allow(_handle, msg.sender);
        TFHE.allowThis(_handle);
    }
}
