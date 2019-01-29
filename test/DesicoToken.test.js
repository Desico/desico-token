import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';

var BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const DesicoToken = artifacts.require('./DesicoToken.sol');

contract('DesicoToken', function (accounts) {
  const cap = new BigNumber(1023018);
  const name = 'Desico';
  const symbol = 'DESI';
  const decimals = 0;

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

    it('should have 18 decimals', async function () {
      (await token.decimals()).should.be.bignumber.equal(decimals);
    });

    it('should have correct cap', async function () {
      (await token.cap()).should.be.bignumber.equal(cap);
    });
  });
});
