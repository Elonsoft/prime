const PrimeToken = artifacts.require('./PrimeToken.sol'),
  walletNum = process.env.MULTISIG_WALLET_ADDRESS;

module.exports = function(deployer) {
  deployer.deploy(PrimeToken, walletNum);
};
