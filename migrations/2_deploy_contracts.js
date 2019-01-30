const DesicoToken = artifacts.require('./DesicoToken.sol');

module.exports = function (deployer, network, accounts) {
  if (network === 'development') {
    return;
  }

  web3.eth.getBlockNumber((e, blocknr) => {
    web3.eth.getBlock(blocknr, (e, block) => {
      if (!e) {
        return deployer.deploy(DesicoToken)
          .then(function () {
            return DesicoToken.deployed();
          })
          .then(function (_token) {
            console.log('Token address: ' + DesicoToken.address);
          });
      }
    });
  });
};
