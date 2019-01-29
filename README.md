# Desico Token

[![https://badges.frapsoft.com/os/mit/mit.svg?v=102](https://badges.frapsoft.com/os/mit/mit.svg?v=102)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/Desico/desico-token-crowdsale.svg?branch=master)](https://travis-ci.org/Desico/desico-token-crowdsale)
[![Coverage Status](https://coveralls.io/repos/github/Desico/desico-token-crowdsale/badge.svg?branch=master)](https://coveralls.io/github/Desico/desico-token-crowdsale?branch=master)

## About

<p align="center">
  <img src="https://www.desico.io/images/logo.png">
</p>

DESICO is the world’s first platform to issue, buy, and sell security tokens in full compliance with the law. See [desico.io](https://www.desico.io) for more details.

## Development

The smart contracts are being implemented in Solidity `0.4.21`.

### Prerequisites

* [NodeJS](htps://nodejs.org), version 9+ (I use [`nvm`](https://github.com/creationix/nvm) to manage Node versions — `brew install nvm`.)
* [truffle](http://truffleframework.com/), which is a comprehensive framework for Ethereum development. `npm install -g truffle` — this should install Truffle v4.1.5 or better.  Check that with `truffle version`.


### Initialisation

        npm install

### Compiling

#### From within Truffle

Run the `truffle` development environment

    truffle develop

then from the prompt you can run

    compile
    migrate
    test

as well as other truffle commands. See [truffleframework.com](http://truffleframework.com) for more.

#### Standalone

Run

    npm test

To generate code coverage reports run

    npm run coverage

*Note* Generating code coverage reports takes a bit longer to run than just running the tests.

### Linting

We provide the following linting options

* `npm run lint` — to lint the solidity files and the javascript.

### Deploying to `rinkeby`

You'll need an address on the Rinkeby blockchain with some ETH in it.

Use [MetaMask](https://metamask.io) to create a wallet and use [faucet.metamask.io](https://faucet.metamask.io/) to get some ETH for it.

You will need to supply a file called `.env` in the root of the project (copy & change from `.env.test`).

Then run

    npm run deploy:rinkeby


## API

        node app.js
        

  - `/whitelist/:address` - check address is whitelisted (`curl -X GET http://localhost:3000/whitelist/0x0`)
  - `/whitelist/:address` -  add address to whitelist (`curl -X POST http://localhost:3000/whitelist/0x0`)
  - `/whitelist/:address` - remove address from whitelist (`curl -X DELETE http://localhost:3000/whitelist/0x0`)
  - `/ico/started` - check ICO is started or not (`curl -X GET http://localhost:3000/ico/started`)
  - `/ico/ended` - check ICO is ended or not (`curl -X GET http://localhost:3000/ico/ended`)
  - `/ico/initialized` - check ICO is initialized or not (`curl -X GET http://localhost:3000/ico/initialized`)
  - `/ico/initialize` - initialize ICO (`curl -X GET http://localhost:3000/ico/initialize`)
  - `/ico/finalized` - check ICO is finalized or not (`curl -X GET http://localhost:3000/ico/finalized`)
  - `/ico/finalize` - finalize ICO (`curl -X GET http://localhost:3000/ico/finalize`)
  - `/ico/amount/:value` - get current rate (by wei) (`curl -X GET http://localhost:3000/ico/amount/10000000000000000000`)