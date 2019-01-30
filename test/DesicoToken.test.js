import EVMRevert from './helpers/EVMRevert';

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

const DesicoToken = artifacts.require('./DesicoToken.sol');

contract('DesicoToken', function ([_, minter, recipient, anotherAccount, ...otherAccounts]) {
  const name = 'Desico';
  const symbol = 'DESI';
  const decimals = 0;
  const cap = 1023018;

  var token;

  beforeEach(async function () {
    token = await DesicoToken.new();
  });

  describe('detailed', function () {
    it('should have a name', async function () {
      (await token.name()).should.be.equal(name);
    });

    it('should have a symbol', async function () {
      (await token.symbol()).should.be.equal(symbol);
    });

    it('should have ' + decimals + ' decimals', async function () {
      (await token.decimals()).toNumber().should.be.equal(decimals);
    });
  });

  describe('capped', function () {
    it('should have correct cap', async function () {
      (await token.cap()).toNumber().should.be.equal(cap);
    });

    it('should mint when amount is less than cap', async function () {
      const amount = 100;
      await token.mint(recipient, amount, { from: _ }).should.be.fulfilled;
      (await token.totalSupply()).toNumber().should.be.equal(amount);
    });

    it('should fail to mint if the amount exceeds the cap', async function () {
      await token.mint(anotherAccount, cap + 1, { from: _ }).should.be.rejectedWith(EVMRevert);
    });

    it('should fail to mint after cap is reached', async function () {
      await token.mint(recipient, cap, { from: _ }).should.be.fulfilled;
      await token.mint(anotherAccount, 1, { from: _ }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('pausable', function () {
    it('default should be paused', async function () {
      (await token.paused()).should.be.equal(true);
    });

    it('should be able to pause/unpause', async function () {
      (await token.paused()).should.be.equal(true);

      await token.unpause().should.be.fulfilled;
      (await token.paused()).should.be.equal(false);

      await token.pause().should.be.fulfilled;
      (await token.paused()).should.be.equal(true);
    });
  });
});
