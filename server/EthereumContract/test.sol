// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract testing {
    uint public x;

    
    function setval(uint val) public {
        x = val;
    }

    //cpu-intensive
    function computeFibonacci(uint n) public pure returns (uint) {
        if (n <= 1) {
            return n;
        } else {
            return computeFibonacci(n - 1) + computeFibonacci(n - 2);
        }
    }

    
    uint public fibonacciResult;

    function computeAndStoreFibonacci(uint n) public returns (uint) {
        uint result = computeFibonacci(n);
        fibonacciResult = result;  // Store the result in the contract's state
        return result;
    }

        
    uint[] public dataArray;

    // Function to store multiple values in an array
    function storeData(uint[] memory _data) public {
        for (uint i = 0; i < _data.length; i++) {
            dataArray.push(_data[i]);
        }
    }


}