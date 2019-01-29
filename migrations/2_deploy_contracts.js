const DesicoCrowdsale = artifacts.require('./DesicoCrowdsale.sol');
const DesicoToken = artifacts.require('./DesicoToken.sol');
const CSVParser = require('csv-parse/lib/sync');
const fs = require('fs');

module.exports = function (deployer, network, accounts) {
  if (network === 'development') {
    return;
  }

  var ico;
  var token;
  var tokenOwner;

  web3.eth.getBlockNumber((e, blocknr) => {
    web3.eth.getBlock(blocknr, (e, block) => {
      if (!e) {
        const startTime = block.timestamp + 60;
        const endTime = startTime + 86400 * 30;

        return deployer.deploy(DesicoToken)
          .then(function () {
            return DesicoToken.deployed();
          })
          .then(function (_token) {
            console.log('Token address: ' + DesicoToken.address);

            token = _token;

            return deployer.deploy(
              DesicoCrowdsale,
              startTime,
              endTime,
              crowdsaleWallet,
              DesicoToken.address);
          })
          .then(function () {
            return DesicoCrowdsale.deployed();
          })
          .then(function () {
            console.log('Crowdsale address: ' + DesicoCrowdsale.address);

            return token.owner.call();
          })
          .then(function (_owner) {
            tokenOwner = _owner;

            console.log('DesicoToken owner : ' + tokenOwner);

            return token.transferOwnership(DesicoCrowdsale.address, { from: tokenOwner });
          })
          .then(function () {
            console.log('DesicoToken owner was changed: ' + DesicoCrowdsale.address);

            return DesicoCrowdsale.deployed();
          })
          .then(function (_ico) {
            ico = _ico;

            return ico.addManyToWhitelist([
              ownerWallet,
              crowdsaleWallet,
              teamWallet,
              reserveWallet,
              foundationWallet,
              advisorsWallet,
              bountiesWallet,
              financialSupportersWallet,
            ]);
          })
          .then(async function () {
            const batchSize = 100;
            const rawData = fs.readFileSync('data/whitelist.csv').toString('utf-8');
            const data = CSVParser(rawData, { columns: true });

            if (data.length > 0) {
              let accounts = [];
              for (let row of data) {
                accounts.push({ address: web3.toHex(row.account) });
              }

              var whitelistedCount = 0;
              while (whitelistedCount < accounts.length) {
                let accountsToImport = [];
                let i = 0;
                while (accountsToImport.length < batchSize && whitelistedCount + i < accounts.length) {
                  accountsToImport.push(accounts[whitelistedCount + i].address);
                  i++;
                }

                await ico.addManyToWhitelist(accountsToImport);

                whitelistedCount += accountsToImport.length;
              }
            }

            console.log('Wallets whitelisted');
          });
      }
    });
  });
};
