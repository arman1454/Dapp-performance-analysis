// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract testing{
    uint public x;

    function setval(uint val) public {
        x = val;
    }

    function someComplexFunction(uint[] memory data) public pure returns (uint) {
        uint sum = 0;
        for (uint i = 0; i < data.length; i++) {
            sum += data[i];
            sum *= 2;  // Some arbitrary complex operation
            sum /= 2;
        }
        return sum;
    }
}
