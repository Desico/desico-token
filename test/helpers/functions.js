import EVMRevert from './EVMRevert';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function pauseAsync (token, address, owner) {
  (await token.paused()).should.be.equal(false);

  await token.pause({ from: address }).should.be.rejectedWith(EVMRevert);

  await token.pause({ from: owner }).should.be.fulfilled;
  (await token.paused()).should.be.equal(true);
};

async function unpauseAsync (token, address, owner) {
  (await token.paused()).should.be.equal(true);

  await token.unpause({ from: address }).should.be.rejectedWith(EVMRevert);

  await token.unpause({ from: owner }).should.be.fulfilled;
  (await token.paused()).should.be.equal(false);
};

async function addWhitelistedAsync (token, address, owner) {
  await token.addWhitelisted(ZERO_ADDRESS, { from: owner }).should.be.rejectedWith(EVMRevert);
  await token.addWhitelisted(address, { from: address }).should.be.rejectedWith(EVMRevert);

  (await token.isWhitelisted(address)).should.be.equal(false);
  await token.addWhitelisted(address, { from: owner }).should.be.fulfilled;
  (await token.isWhitelisted(address)).should.be.equal(true);
};

async function mintFromZeroAsync (token, address, amount, owner) {
  await token.mint(ZERO_ADDRESS, amount, { from: owner }).should.be.rejectedWith(EVMRevert);
  await token.mint(address, amount, { from: address }).should.be.rejectedWith(EVMRevert);
  
  (await token.balanceOf(address)).toNumber().should.be.equal(0);
  await token.mint(address, amount, { from: owner }).should.be.fulfilled;
  (await token.balanceOf(address)).toNumber().should.be.equal(amount);
};

async function redeemAsync (token, amount, owner, recipient, anotherAccount) {
  await token.redeem(ZERO_ADDRESS, amount, { from: anotherAccount }).should.be.rejectedWith(EVMRevert);
  await token.redeem(recipient, amount, { from: anotherAccount }).should.be.rejectedWith(EVMRevert);
  await token.redeem(recipient, amount, { from: recipient }).should.be.rejectedWith(EVMRevert);

  await token.redeem(recipient, amount, { from: owner }).should.be.fulfilled;
};

module.exports = {
  ZERO_ADDRESS,
  pauseAsync,
  unpauseAsync,
  addWhitelistedAsync,
  mintFromZeroAsync,
  redeemAsync
};
