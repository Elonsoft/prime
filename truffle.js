require('dotenv').config();

require('babel-register');
require('babel-polyfill');

module.exports = {
  mocha: {
    useColors: true
  },
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      // port: 7545,
      network_id: '*',
      // gas: 0xFFFFFFFF,
      // gasPrice: 0x01
    },
    ropsten: {
      host: 'localhost',
      port: 8545,
      network_id: '3',
      gas: 2900000
    },
    live: {
      host: '192.168.1.3',
      port: 8545,
      network_id: 1,
      gas: 300000,
      gasPrice: 40000000000,
      from: '0x00bA5F4c653837b94Df5cE11C9FD66081b6e048E'
    },
    coverage: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 0xFFFFFFFF
      // gasPrice: 0x01
    },
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
