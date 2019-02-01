import EVMRevert from './helpers/EVMRevert';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const DesicoToken = artifacts.require('./DesicoToken.sol');

contract('DesicoToken', function ([owner, recipient, anotherAccount, ...otherAccounts]) {
  const name = 'Desico';
  const symbol = 'DESI';
  const decimals = 0;
  const cap = 1023018;

  var token;

  beforeEach(async function () {
    token = await DesicoToken.new();
  });

  var _pauseAsync = async function (token, address, owner) {
    (await token.paused()).should.be.equal(false);

    await token.pause({ from: address }).should.be.rejectedWith(EVMRevert);

    await token.pause({ from: owner }).should.be.fulfilled;
    (await token.paused()).should.be.equal(true);
  };

  var _unpauseAsync = async function (token, address, owner) {
    (await token.paused()).should.be.equal(true);

    await token.unpause({ from: address }).should.be.rejectedWith(EVMRevert);

    await token.unpause({ from: owner }).should.be.fulfilled;
    (await token.paused()).should.be.equal(false);
  };

  var _addWhitelistedAsync = async function (token, address, owner) {
    await token.addWhitelisted(ZERO_ADDRESS, { from: owner }).should.be.rejectedWith(EVMRevert);
    await token.addWhitelisted(address, { from: address }).should.be.rejectedWith(EVMRevert);

    (await token.isWhitelisted(address)).should.be.equal(false);
    await token.addWhitelisted(address, { from: owner }).should.be.fulfilled;
    (await token.isWhitelisted(address)).should.be.equal(true);
  };

  var _mintFromZeroAsync = async function (token, address, amount, owner) {
    await token.mint(ZERO_ADDRESS, amount, { from: owner }).should.be.rejectedWith(EVMRevert);
    await token.mint(address, amount, { from: address }).should.be.rejectedWith(EVMRevert);
    
    (await token.balanceOf(address)).toNumber().should.be.equal(0);
    await token.mint(address, amount, { from: owner }).should.be.fulfilled;
    (await token.balanceOf(address)).toNumber().should.be.equal(amount);
  };

  var _redeemAsync = async function (amount, owner, recipient, anotherAccount) {
    await token.redeem(ZERO_ADDRESS, amount, { from: anotherAccount }).should.be.rejectedWith(EVMRevert);
    await token.redeem(recipient, amount, { from: anotherAccount }).should.be.rejectedWith(EVMRevert);
    await token.redeem(recipient, amount, { from: recipient }).should.be.rejectedWith(EVMRevert);

    await token.redeem(recipient, amount, { from: owner }).should.be.fulfilled;
  };

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

    it('should contain correct owner', async function () {
      (await token.owner()).should.be.equal(owner);
    });

    it('should be able to transfer ownership', async function () {
      await token.transferOwnership(recipient, { from: anotherAccount }).should.be.rejectedWith(EVMRevert);

      await token.transferOwnership(recipient, { from: owner }).should.be.fulfilled;
      (await token.owner()).should.be.equal(recipient);

      await token.transferOwnership(owner, { from: recipient }).should.be.fulfilled;
      (await token.owner()).should.be.equal(owner);
    });
  });

  describe('capped', function () {
    const amount = 100;

    it('should have correct cap', async function () {
      (await token.cap()).toNumber().should.be.equal(cap);
    });

    it('should mint when amount is less than cap', async function () {
      await _mintFromZeroAsync(token, recipient, amount, owner);
      (await token.totalSupply()).toNumber().should.be.equal(amount);
    });

    it('should fail to mint if the amount exceeds the cap', async function () {
      await token.mint(anotherAccount, cap + 1, { from: owner }).should.be.rejectedWith(EVMRevert);
      (await token.totalSupply()).toNumber().should.be.equal(0);
    });

    it('should fail to mint after cap is reached', async function () {
      await _mintFromZeroAsync(token, recipient, cap, owner);

      await token.mint(anotherAccount, 1, { from: owner }).should.be.rejectedWith(EVMRevert);
      (await token.balanceOf(recipient)).toNumber().should.be.equal(cap);
    });

    it('should mint when paused', async function () {
      (await token.paused()).should.be.equal(true);

      await _mintFromZeroAsync(token, recipient, amount, owner);
    });

    it('should mint when not paused', async function () {
      await _unpauseAsync(token, recipient, owner);
      await _mintFromZeroAsync(token, recipient, amount, owner);
    });
  });

  describe('burnable', function () {
    const amount = 100;
    const amountToBurn = 25;
    const amountAfterBurn = amount - amountToBurn;

    it('should burn when paused', async function () {
      (await token.paused()).should.be.equal(true);

      (await token.totalSupply()).toNumber().should.be.equal(0);

      await _mintFromZeroAsync(token, recipient, amount, owner);
      (await token.balanceOf(recipient)).toNumber().should.be.equal(amount);
      (await token.totalSupply()).toNumber().should.be.equal(amount);

      await _redeemAsync(amountToBurn, owner, recipient, anotherAccount);
      (await token.balanceOf(recipient)).toNumber().should.be.equal(amountAfterBurn);
      (await token.totalSupply()).toNumber().should.be.equal(amountAfterBurn);
    });

    it('should burn when not paused', async function () {
      await _unpauseAsync(token, recipient, owner);

      (await token.totalSupply()).toNumber().should.be.equal(0);

      await _mintFromZeroAsync(token, recipient, amount, owner);
      (await token.balanceOf(recipient)).toNumber().should.be.equal(amount);
      (await token.totalSupply()).toNumber().should.be.equal(amount);
      
      await _redeemAsync(amountToBurn, owner, recipient, anotherAccount);
      (await token.balanceOf(recipient)).toNumber().should.be.equal(amountAfterBurn);
      (await token.totalSupply()).toNumber().should.be.equal(amountAfterBurn);
    });
  });

  describe('whitelisted', function () {
    const amount = 100;
    const amountToSend = 25;

    it('should not be whitelisted', async function () {
      (await token.isWhitelisted(recipient)).should.be.equal(false);
    });

    it('should be whitelisted', async function () {
      await _addWhitelistedAsync(token, recipient, owner);
    });

    it('should not be able to transfer (not whitelisted)', async function () {
      (await token.isWhitelisted(recipient)).should.be.equal(false);

      await _mintFromZeroAsync(token, recipient, amount, owner);

      token.transfer(anotherAccount, amountToSend, { from: recipient }).should.be.rejectedWith(EVMRevert);
      (await token.balanceOf(recipient)).toNumber().should.be.equal(amount);
    });

    it('should be able to transfer (whitelisted)', async function () {
      await _unpauseAsync(token, recipient, owner);
      await _addWhitelistedAsync(token, recipient, owner);
      await _mintFromZeroAsync(token, recipient, amount, owner);

      (await token.balanceOf(anotherAccount)).toNumber().should.be.equal(0);
      await token.transfer(anotherAccount, amountToSend, { from: recipient }).should.be.rejectedWith(EVMRevert);
      
      await _addWhitelistedAsync(token, anotherAccount, owner);

      await token.transfer(anotherAccount, amountToSend, { from: recipient }).should.be.fulfilled;
      (await token.balanceOf(anotherAccount)).toNumber().should.be.equal(amountToSend);
      (await token.balanceOf(recipient)).toNumber().should.be.equal(amount - amountToSend);
    });
  });

  describe('pausable', function () {
    it('default should be paused', async function () {
      (await token.paused()).should.be.equal(true);
    });

    it('should be able to pause/unpause', async function () {
      await _unpauseAsync(token, recipient, owner);
      await _pauseAsync(token, recipient, owner);
    });

    it('should be able to transfer when unpaused', async function () {
      const amount = 100;
      const amountWhenSmall = 0.5;

      (await token.paused()).should.be.equal(true);

      await _mintFromZeroAsync(token, recipient, amount, owner);

      await _addWhitelistedAsync(token, recipient, owner);
      await _addWhitelistedAsync(token, anotherAccount, owner);

      await token.transfer(anotherAccount, amount, { from: recipient }).should.be.rejectedWith(EVMRevert);

      await _unpauseAsync(token, recipient, owner);
      
      await token.transfer(anotherAccount, amountWhenSmall, { from: recipient }).should.not.be.fulfilled;
      await token.transfer(anotherAccount, amount + amount, { from: recipient }).should.be.rejectedWith(EVMRevert);
      await token.transfer(anotherAccount, amount, { from: recipient }).should.be.fulfilled;
      (await token.balanceOf(anotherAccount)).toNumber().should.be.equal(amount);
      
    });
  });
});
