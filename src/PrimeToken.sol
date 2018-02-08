pragma solidity 0.4.19;

// ----------------------------------------------------------------------------
// PRIME token contract
//
// Symbol      : PRIME
// Name        : PRIME PRETGE
// Total supply: 250000000
// Decimals    : 18
//
//
// By using this smart-contract you confirm to have read and
// agree to the terms and conditions set herein: http://primeshipping.io/legal
// ----------------------------------------------------------------------------

import './zeppelin/token/StandardToken.sol';


contract PrimeToken is StandardToken {
  string public constant name = 'PRIME PRETGE';
  string public constant symbol = 'PRIME';
  uint256 public constant decimals = 18;

  uint256 public constant tokenCreationCap = 250000000 * 10 ** decimals;
  string public constant LEGAL = 'By using this smart-contract you confirm to have read and agree to the terms and conditions set herein: http://primeshipping.io/legal';

  address public wallet;
  address public owner;

  bool public active = true;

  uint256 public oneTokenInWei = 50000000000000000;
  uint256 public minimumAllowedWei = 5000000000000000000;

  modifier onlyOwner {
    if (owner != msg.sender) {
      revert();
    }
    _;
  }

  modifier onlyActive {
    if (!active) {
      revert();
    }
    _;
  }

  event Mint(address indexed to, uint256 amount);
  event MintFinished();

  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(
    address indexed purchaser,
    address indexed beneficiary,
    uint256 value,
    uint256 amount
  );

  function PrimeToken(address _wallet) public {
    wallet = _wallet;
    owner = msg.sender;
  }

  function() payable public {
    createTokens();
  }

  /**
   * @param  _to Target address.
   * @param  _amount Amount of PRIME tokens, _NOT_ multiplied to decimals.
   */
  function mintTokens(address _to, uint256 _amount) external onlyOwner {
    uint256 decimalsMultipliedAmount = _amount.mul(10 ** decimals);
    uint256 checkedSupply = totalSupply.add(decimalsMultipliedAmount);
    require(tokenCreationCap > checkedSupply);

    balances[_to].add(decimalsMultipliedAmount);
    totalSupply = checkedSupply;

    Mint(_to, decimalsMultipliedAmount);
    Transfer(address(0), _to, decimalsMultipliedAmount);
  }

  function withdraw() external onlyOwner {
    wallet.transfer(this.balance);
  }

  function finalize() external onlyOwner {
    active = false;

    MintFinished();
  }

  /**
   * Sets price in wei per 1 PRIME token.
   */
  function setTokenPriceInWei(uint256 _oneTokenInWei) external onlyOwner {
    oneTokenInWei = _oneTokenInWei;
  }

  function createTokens() internal onlyActive {
    require(msg.value >= minimumAllowedWei);

    uint256 decimalsMultipliedAmount = msg.value.mul(10 ** decimals);
    uint256 checkedSupply = totalSupply.add(decimalsMultipliedAmount);
    require(tokenCreationCap > checkedSupply);

    balances[msg.sender].add(decimalsMultipliedAmount);
    totalSupply = checkedSupply;

    Mint(msg.sender, decimalsMultipliedAmount);
    Transfer(address(0), msg.sender, decimalsMultipliedAmount);
    TokenPurchase(
      msg.sender,
      msg.sender,
      msg.value,
      decimalsMultipliedAmount
    );
  }

  function setMinimumAllowedWei(uint256 _wei) external onlyOwner {
    minimumAllowedWei = _wei;
  }
}
