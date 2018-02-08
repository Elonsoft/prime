'use strict';

const assertJump = require('./helpers/assertJump'),
  expectThrow = require('./helpers/expectThrow'),
  PrimeTokenMock = artifacts.require('./helpers/PrimeTokenMock.sol'),
  BigNumber = web3.BigNumber,
  expect = require('chai').expect,
  should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

contract('PrimeToken', function(accounts) {
  const MULTI_SIG_WALLET_ADDRESS = accounts[5],
   INITIAL_BALANCE = new BigNumber(100);

  let token, tokenDecimals, tokenDecimalsIncrease;

  describe('basic', async function() {
    beforeEach(async function () {
      token = await PrimeTokenMock.new(accounts[0], INITIAL_BALANCE, MULTI_SIG_WALLET_ADDRESS);
    });

    it('has a valid multisig wallet', async function() {
      const walletAddress = await token.wallet();
      assert.equal(walletAddress, MULTI_SIG_WALLET_ADDRESS);
    });

    it('should return the correct totalSupply after construction', async function() {
      let totalSupply = await token.totalSupply();

      totalSupply.should.be.bignumber.equal(INITIAL_BALANCE);
    });
  });

  describe('minting', async function() {
    beforeEach(async function () {
      token = await PrimeTokenMock.new(accounts[0], 0, MULTI_SIG_WALLET_ADDRESS);
      tokenDecimals = new BigNumber(await token.decimals());
      tokenDecimalsIncrease = new BigNumber(10).pow(tokenDecimals);
    });

    it('should mint a given amount of tokens to a given address', async function() {
      // given
      const expectedTotalSupply = new BigNumber(100).mul(tokenDecimalsIncrease),
        expectedReceiverBalance = new BigNumber(100).mul(tokenDecimalsIncrease);

      // when
      await token.mintTokens(accounts[1], 100);

      // then
      // validate receiver balance
      const balance1 = await token.balanceOf(accounts[1]);
      balance1.should.be.bignumber.equal(expectedReceiverBalance);

      // validate totalSupply
      const totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTotalSupply);
    });
  });

  describe('create tokens', async function() {
    beforeEach(async function () {
      token = await PrimeTokenMock.new(accounts[0], INITIAL_BALANCE, MULTI_SIG_WALLET_ADDRESS);
    });

    it('should transfer 1 PRIME token successfully', async function() {
      // given
      const expectedTotalSupply = new BigNumber(100),
        expectedPrimeTransferredAmount = 1,
        expectedSenderBalance = new BigNumber(99);

      // when
      await token.transfer(accounts[1], 1);

      // then
      // validate receiver balance
      const balance1 = await token.balanceOf(accounts[1]);
      balance1.should.be.bignumber.equal(expectedPrimeTransferredAmount);

      // validate totalSupply
      const totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTotalSupply);

      // validate sender balance
      const senderBalance = await token.balanceOf(accounts[0]);
      senderBalance.should.be.bignumber.equal(expectedSenderBalance);
    });

    it('should transfer 5 PRIME tokens successfully', async function() {
      // given
      const expectedTotalSupply = new BigNumber(100),
        expectedPrimeTransferredAmount = new BigNumber(5),
        expectedSenderBalance = new BigNumber(95);

      // when
      await token.transfer(accounts[1], 5);

      // then
      // validate receiver balance
      const balance1 = await token.balanceOf(accounts[1]);
      balance1.should.be.bignumber.equal(expectedPrimeTransferredAmount);

      // validate totalSupply
      const totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTotalSupply);

      // validate sender balance
      const senderBalance = await token.balanceOf(accounts[0]);
      senderBalance.should.be.bignumber.equal(expectedSenderBalance)
    });

    it('should throw when sender does not have enough tokens', async function() {
      // given
      const tokensToTransfer = 1000;

      // when
      try {
        await token.transfer(accounts[1], tokensToTransfer);
        assert.fail('should have thrown before');
      } catch (e) {
        assertJump(e);
      }
    });

    it('should respect the hardcap on creating 1 PRIME token', async function() {
      // given
      const hardcap = 10700000;

      // when
      // mint the maximum allowed tokens
      await token.mintTokens(accounts[1], hardcap);
      const totalSupply = await token.totalSupply();
      assert(totalSupply.toNumber(), hardcap);

      // then
      try {
        await token.mintTokens(accounts[1], 1);
        assert.fail('should have thrown before');
      } catch (e) {
        assertJump(e);
      }
    });

    it('should not transfer 1 PRIME token if contract is not active', async function() {
      // given
      const tokensToTransfer = 1;
      let contractStatus;

      // when
      contractStatus = token.active();
      assert(contractStatus, true);
      await token.finalize();
      contractStatus = token.active();
      assert(contractStatus, false);

      try {
        await token.transfer(accounts[1], tokensToTransfer);
        assert.fail('should have thrown before');
      } catch (e) {
        assertJump(e);
      }
    });

    it('should not transfer 5 PRIME tokens if contract is not active', async function() {
      // given
      const tokensToTransfer = 5;
      let contractStatus;

      // when
      contractStatus = token.active();
      assert(contractStatus, true);
      await token.finalize();
      contractStatus = token.active();
      assert(contractStatus, false);

      try {
        await token.transfer(accounts[1], tokensToTransfer);
        assert.fail('should have thrown before');
      } catch (e) {
        assertJump(e);
      }
    });
  });

  describe('creating tokens with restrictions', async function() {
    beforeEach(async function () {
      token = await PrimeTokenMock.new(accounts[0], 0, MULTI_SIG_WALLET_ADDRESS);
      tokenDecimals = new BigNumber(await token.decimals());
      tokenDecimalsIncrease = new BigNumber(10).pow(tokenDecimals);
    });

    it('should not mint PRIME tokens if minimum ETH transfer amount less then 5', async function() {
      // given
      const ethToTransfer = web3.toWei(4, 'ether'),
        expectedPrimeTransferredAmount = new BigNumber(1);

      // when
      const contractStatus = token.active();
      assert(contractStatus, true);

      try {
        await web3.eth.sendTransaction({
          value: ethToTransfer,
          from: accounts[1],
          to: token.address
        })
        assert.fail('should have thrown before');
      } catch (e) {
        assertJump(e);
      }
    });

    it('should mint 1 PRIME token if minimum ETH transfer amount equals to 5', async function() {
      // given
      const ethToTransfer = web3.toWei(5, 'ether'),
        expectedTotalSupply = new BigNumber(100000).mul(tokenDecimalsIncrease),
        expectedPrimeTransferredAmount = new BigNumber(100000).mul(tokenDecimalsIncrease);

      // validate total supply
      let totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(new BigNumber(0))

      // when
      const contractStatus = await token.active();
      assert(contractStatus, true);

      await web3.eth.sendTransaction({
        value: ethToTransfer,
        from: accounts[2],
        to: token.address
      });

      // validate  total supply
      totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTotalSupply);

      // validate balance
      const balance = await token.balanceOf(accounts[2]);
      balance.should.be.bignumber.equal(expectedPrimeTransferredAmount);
    });
  });
});
