// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "fhevm/config/ZamaFHEVMConfig.sol";
import "fhevm/config/ZamaGatewayConfig.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "fhevm/lib/TFHE.sol";

contract HomomorphicArithmetic is GatewayCaller, SepoliaZamaFHEVMConfig, SepoliaZamaGatewayConfig {
    euint8 _handle;

    function addValues(einput input0, einput input1, bytes calldata inputProof) public {
        euint8 param0 = TFHE.asEuint8(input0, inputProof);
        euint8 param1 = TFHE.asEuint8(input1, inputProof);

        _handle = TFHE.add(param0, param1);

        TFHE.allow(_handle, msg.sender);
        TFHE.allowThis(_handle);
    }

    function getHandle() public view returns (euint8) {
        return _handle;
    }

    function multiplyValues(einput input0, einput input1, bytes calldata inputProof)  public {
        euint8 param0 = TFHE.asEuint8(input0, inputProof);
        euint8 param1 = TFHE.asEuint8(input1, inputProof);

        _handle = TFHE.mul(param0, param1);

        TFHE.allow(_handle, msg.sender);
        TFHE.allowThis(_handle);
    }

    function randomValue() public {
        _handle = TFHE.randEuint8();

        TFHE.allow(_handle, msg.sender);
        TFHE.allowThis(_handle);
    }
}
