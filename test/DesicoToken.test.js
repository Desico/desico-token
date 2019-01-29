var chai = require('chai');
chai.should();

const DesicoToken = artifacts.require('./DesicoToken.sol');

contract('DesicoToken', function (accounts) {
  const name = 'Desico';
  const symbol = 'DESI';
  const decimals = 0;
  const cap = 1023018;

  var token;

  beforeEach(async function () {
    token = await DesicoToken.new();
  });

  describe('details', function () {
    it('should have a name', async function () {
      (await token.name()).should.be.equal(name);
    });

    it('should have a symbol', async function () {
      (await token.symbol()).should.be.equal(symbol);
    });

    it('should have ' + decimals + ' decimals', async function () {
      (await token.decimals()).toNumber().should.be.equal(decimals);
    });

    it('should have correct cap', async function () {
      (await token.cap()).toNumber().should.be.equal(cap);
    });
  });
});
