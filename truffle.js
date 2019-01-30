require('dotenv').config();
require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = 'alcohol tent virus since trouble answer unusual black lumber august afraid pole bar solid left';

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  // default mnemonic: https://iancoleman.io/bip39/#english
  process.env.MNEMONIC || mnemonic,
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
);

module.exports = {
  solc: {
    optimizer: {
      version: '^0.5.0',
      enabled: true,
      runs: 200,
    },
  },
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    live: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    rinkeby: {
      provider: infuraProvider('rinkeby'),
      network_id: 4, // eslint-disable-line camelcase
      gas: 4712388,
      gasPrice: 65000000000,
    },
    mainnet: {
      provider: infuraProvider('mainnet'),
      network_id: 1, // eslint-disable-line camelcase
      gas: 4712388,
      gasPrice: 65000000000,
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
  },
};
