pragma solidity 0.4.19;

import '../../contracts/PrimeToken.sol';


contract PrimeTokenMock is PrimeToken {
  function PrimeTokenMock(address initialAccount, uint256 initialBalance, address _multiSigWallet)
    PrimeToken(_multiSigWallet)
  {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }
}
