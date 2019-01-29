import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';
import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';

var BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const DesicoToken = artifacts.require('./DesicoToken.sol');
const DesicoCrowdsale = artifacts.require('./DesicoCrowdsale.sol');

contract('DesicoCrowdsale', function (accounts) {
  const ownerWallet = accounts[0];
  const crowdsaleWallet = accounts[1];
  const teamWallet = accounts[2];
  const reserveWallet = accounts[3];
  const foundationWallet = accounts[4];
  const advisorsWallet = accounts[5];
  const bountiesWallet = accounts[6];
  const financialSupportersWallet = accounts[7];
  const otherWhitelistedWallet = accounts[8];
  const otherNotWhitelistedWallet = accounts[9];
  const minLimit = 0.1;

  var token;
  var ico;
  var openingTime;
  var closingTime;
  var afterClosingTime;
  var lockedSupply;
  var totalSupply;
  var crowdsaleSupply;
  var teamSupply;
  var financialSupportersSupply;
  var advisorsSupply;
  var foundationSupply;
  var bountiesSupply;
  var reserveSupply;
  var rate;
  var cap;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    openingTime = latestTime() + duration.weeks(1);
    closingTime = openingTime + duration.weeks(1);
    afterClosingTime = closingTime + duration.seconds(1);

    token = await DesicoToken.new(
      latestTime() + duration.years(1),
      teamWallet,
      reserveWallet,
      foundationWallet,
      advisorsWallet,
      bountiesWallet,
      financialSupportersWallet
    );

    var owner = await token.owner();

    ico = await DesicoCrowdsale.new(
      openingTime,
      closingTime,
      crowdsaleWallet,
      token.address
    );

    await token.transferOwnership(ico.address, { from: owner });
    await ico.initialize();
    await ico.addManyToWhitelist([
      teamWallet,
      reserveWallet,
      foundationWallet,
      advisorsWallet,
      bountiesWallet,
      financialSupportersWallet,
      otherWhitelistedWallet,
    ]);
  });

  describe('before opening', function () {
    it('should initialize', async function () {
      (await ico.initialized()).should.be.equal(true);
    });
  
    it('should not re-initialize', async function () {
      (await ico.initialized()).should.be.equal(true);

      await ico.initialize().should.be.rejectedWith(EVMRevert);
    });
  
    it('should have rate', async function () {
      rate = await ico.rate();
      rate.should.be.bignumber.gt(0);
    });

    it('should have cap', async function () {
      cap = await token.cap();
      cap.should.be.bignumber.gt(0);
    });

    it('closing time should be greater then opening time', async function () {
      openingTime = await ico.openingTime();
      closingTime = await ico.closingTime();
      afterClosingTime = closingTime.add(duration.seconds(1));

      closingTime.should.be.bignumber.gt(openingTime);
    });

    it('opening time must be in the future', async function () {
      openingTime.should.be.bignumber.gt(latestTime());
    });

    it('should not be opened', async function () {
      (await ico.started()).should.be.equal(false);
    });

    it('should not be closed', async function () {
      (await ico.ended()).should.be.equal(false);
    });

    it('wallets should be whitelisted', async function () {
      (await ico.whitelist.call(teamWallet)).should.be.equal(true);
      (await ico.whitelist.call(reserveWallet)).should.be.equal(true);
      (await ico.whitelist.call(foundationWallet)).should.be.equal(true);
      (await ico.whitelist.call(advisorsWallet)).should.be.equal(true);
      (await ico.whitelist.call(bountiesWallet)).should.be.equal(true);
      (await ico.whitelist.call(financialSupportersWallet)).should.be.equal(true);
    });

    it('should add/reove from whitelist', async function () {
      (await ico.whitelist.call(otherNotWhitelistedWallet)).should.be.equal(false);

      await ico.addToWhitelist(otherNotWhitelistedWallet).should.be.fulfilled;
      (await ico.whitelist.call(otherNotWhitelistedWallet)).should.be.equal(true);

      await ico.removeFromWhitelist(otherNotWhitelistedWallet).should.be.fulfilled;
      (await ico.whitelist.call(otherNotWhitelistedWallet)).should.be.equal(false);
    });

    it('token should be paused', async function () {
      (await token.paused()).should.be.equal(true);
    });

    it('should initialize token distribution', async function () {
      totalSupply = await token.cap();
      crowdsaleSupply = await ico.TOTAL_SUPPLY();
      teamSupply = await token.TEAM_SUPPLY();
      financialSupportersSupply = await token.FINANCIAL_SUPPORTERS_SUPPLY();
      advisorsSupply = await token.ADVISORS_SUPPLY();
      foundationSupply = await token.FOUNDATION_SUPPLY();
      bountiesSupply = await token.BOUNTIES_SUPPLY();
      reserveSupply = await token.RESERVE_SUPPLY();
        
      lockedSupply = teamSupply
        .add(financialSupportersSupply)
        .add(advisorsSupply)
        .add(foundationSupply)
        .add(bountiesSupply)
        .add(reserveSupply);

      assert(totalSupply.gt(0), 'total supply is a non-zero value');
      assert(crowdsaleSupply.lt(totalSupply), 'crowdsale amount is lower than total supply');

      assert(teamSupply.lt(totalSupply), 'locked foundation amount is lower than total supply');
      assert(financialSupportersSupply.lt(totalSupply), 'locked foundation amount is lower than total supply');
      assert(advisorsSupply.lt(totalSupply), 'locked foundation amount is lower than total supply');
      assert(foundationSupply.lt(totalSupply), 'locked foundation amount is lower than total supply');
      assert(bountiesSupply.lt(totalSupply), 'locked foundation amount is lower than total supply');
      assert(reserveSupply.lt(totalSupply), 'locked foundation amount is lower than total supply');
        
      assert(crowdsaleSupply.add(lockedSupply).lte(totalSupply), 'crowdsale/locked amount do not exceed total supply');
    });

    it('should mint tokens (financial supporters)', async function () {
      var balance = await token.balanceOf(financialSupportersWallet);
      balance.should.be.bignumber.equal(financialSupportersSupply);
    });

    it('should mint tokens (advisors)', async function () {
      var balance = await token.balanceOf(advisorsWallet);
      balance.should.be.bignumber.equal(advisorsSupply);
    });

    it('should mint tokens (bounties)', async function () {
      var balance = await token.balanceOf(bountiesWallet);
      balance.should.be.bignumber.equal(bountiesSupply);
    });

    it('should mint tokens (reserve)', async function () {
      var balance = await token.balanceOf(reserveWallet);
      balance.should.be.bignumber.equal(reserveSupply);
    });

    it('should not release time locked', async function () {
      await token.withdraw().should.be.rejectedWith(EVMRevert);

      (await token.balanceOf(teamWallet)).should.be.bignumber.equal(0);
      (await token.balanceOf(foundationWallet)).should.be.bignumber.equal(0);
    });

    it('should not accept non-whitelisted payments before start', async function () {
      const value = ether(1);

      await ico.send(value).should.be.rejectedWith(EVMRevert);
      await ico.buyTokens(otherNotWhitelistedWallet, { from: otherNotWhitelistedWallet, value: value })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should not accept whitelisted payments before start', async function () {
      const value = ether(1);

      await ico.send(value).should.be.rejectedWith(EVMRevert);
      await ico.buyTokens(otherWhitelistedWallet, { from: otherWhitelistedWallet, value: value })
        .should.be.rejectedWith(EVMRevert);
    });
  });

  describe('opened', function () {
    it('should be opened', async function () {
      await increaseTimeTo(openingTime);
      (await ico.started()).should.be.equal(true);
    });

    it('should not be closed', async function () {
      await increaseTimeTo(openingTime);
      (await ico.ended()).should.be.equal(false);
    });

    it('should not accept non-whitelisted payments during the sale', async function () {
      const value = ether(1);

      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherNotWhitelistedWallet, { from: otherNotWhitelistedWallet, value: value })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should accept whitelisted payments during the sale', async function () {
      const value = ether(1);

      var amount = await ico.amount(value);
      amount.should.be.bignumber.gt(0);
    
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: value, from: otherWhitelistedWallet })
        .should.be.fulfilled;
    
      (await token.balanceOf(otherWhitelistedWallet)).should.be.bignumber.equal(amount);
    });

    it('should not accept whitelisted payments over cap', async function () {
      const value = ether(1);

      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { from: otherWhitelistedWallet, value: value })
        .should.be.fulfilled;

      await ico.buyTokens(otherWhitelistedWallet, { from: otherWhitelistedWallet, value: cap })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should not allow transfers', async function () {
      const value = ether(1);
    
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: value, from: otherWhitelistedWallet })
        .should.be.fulfilled;

      await token.transfer(otherNotWhitelistedWallet, 500, { from: otherWhitelistedWallet })
        .should.be.rejectedWith(EVMRevert); ;
    });

    it('should deny refunds', async function () {
      await ico.claimRefund({ from: otherWhitelistedWallet }).should.be.rejectedWith(EVMRevert);
      await increaseTimeTo(openingTime);
      await ico.claimRefund({ from: otherWhitelistedWallet }).should.be.rejectedWith(EVMRevert);
    });

    it('should reject amount < ' + minLimit, async function () {
      await ico.amount(ether(0)).should.be.rejectedWith(EVMRevert);
      await ico.amount(ether(minLimit - 0.01)).should.be.rejectedWith(EVMRevert);
      (await ico.amount(ether(minLimit))).should.be.bignumber.gt(0);
      (await ico.amount(ether(minLimit + 0.01))).should.be.bignumber.gt(0);
      (await ico.amount(ether(1))).should.be.bignumber.gt(0);
      (await ico.amount(ether(11))).should.be.bignumber.gt(0);
    });

    it('should give correct amount of tokens during 1st stage', async function () {
      const value = ether(1);
      var rate = await ico.STAGE1_RATE();
  
      (await token.balanceOf(otherWhitelistedWallet)).should.be.bignumber.equal(0);
    
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: value, from: otherWhitelistedWallet })
        .should.be.fulfilled;
  
      var balanceAfter = await token.balanceOf(otherWhitelistedWallet);
      var amount = value.mul(rate);
      balanceAfter.should.be.bignumber.equal(amount);
    });
  
    it('should give correct amount of tokens in 1st and 2nd stage', async function () {
      const value = ether(100);
      var goal1 = await ico.STAGE1_GOAL();
      var rate1 = await ico.STAGE1_RATE();
      var rate2 = await ico.STAGE2_RATE();
  
      (await token.balanceOf(otherWhitelistedWallet)).should.be.bignumber.equal(0);
    
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: goal1.add(value), from: otherWhitelistedWallet })
        .should.be.fulfilled;
  
      var balanceAfter = await token.balanceOf(otherWhitelistedWallet);
      var amount = goal1.mul(rate1).add(value.mul(rate2));
      balanceAfter.should.be.bignumber.equal(amount);
    });
  
    it('should give correct amount of tokens in 2nd and 3rd stage', async function () {
      const value = ether(100);
      var goal1 = await ico.STAGE1_GOAL();
      var goal2 = await ico.STAGE2_GOAL();
  
      var rate1 = await ico.STAGE1_RATE();
      var rate2 = await ico.STAGE2_RATE();
      var rate3 = await ico.STAGE3_RATE();
  
      (await token.balanceOf(otherWhitelistedWallet)).should.be.bignumber.equal(0);
  
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: goal2.add(value), from: otherWhitelistedWallet })
        .should.be.fulfilled;
        
      var balanceAfter = await token.balanceOf(otherWhitelistedWallet);
      var ethSpentOn2ndStage = goal2.sub(goal1);
      var amount = goal1.mul(rate1).add(ethSpentOn2ndStage.mul(rate2)).add(value.mul(rate3));
      balanceAfter.should.be.bignumber.equal(amount);
    });
  
    it('should give correct amount of tokens in 3rd and 4th stage', async function () {
      const value = ether(100);
      var goal1 = await ico.STAGE1_GOAL();
      var goal2 = await ico.STAGE2_GOAL();
      var goal3 = await ico.STAGE3_GOAL();
  
      var rate1 = await ico.STAGE1_RATE();
      var rate2 = await ico.STAGE2_RATE();
      var rate3 = await ico.STAGE3_RATE();
      var rate4 = await ico.STAGE4_RATE();
  
      (await token.balanceOf(otherWhitelistedWallet)).should.be.bignumber.equal(0);
  
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: goal3.add(value), from: otherWhitelistedWallet })
        .should.be.fulfilled;
  
      var balanceAfter = await token.balanceOf(otherWhitelistedWallet);
      var ethSpentOn2ndStage = goal2.sub(goal1);
      var ethSpentOn3rdStage = goal3.sub(goal2);
      var amount = goal1.mul(rate1)
        .add(ethSpentOn2ndStage.mul(rate2))
        .add(ethSpentOn3rdStage.mul(rate3))
        .add(value.mul(rate4));
        
      balanceAfter.should.be.bignumber.equal(amount);
    });
    
    it('should give correct amount of tokens in 4th and 5th stage', async function () {
      const value = ether(100);
      var goal1 = await ico.STAGE1_GOAL();
      var goal2 = await ico.STAGE2_GOAL();
      var goal3 = await ico.STAGE3_GOAL();
      var goal4 = await ico.STAGE4_GOAL();
  
      var rate1 = await ico.STAGE1_RATE();
      var rate2 = await ico.STAGE2_RATE();
      var rate3 = await ico.STAGE3_RATE();
      var rate4 = await ico.STAGE4_RATE();
      var rate5 = await ico.STAGE5_RATE();
  
      (await token.balanceOf(otherWhitelistedWallet)).should.be.bignumber.equal(0);
  
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: goal4.add(value), from: otherWhitelistedWallet })
        .should.be.fulfilled;
  
      var balanceAfter = await token.balanceOf(otherWhitelistedWallet);

      var ethSpentOn2ndStage = goal2.sub(goal1);
      var ethSpentOn3rdStage = goal3.sub(goal2);
      var ethSpentOn4thStage = goal4.sub(goal3);
      var amount = goal1.mul(rate1)
        .add(ethSpentOn2ndStage.mul(rate2))
        .add(ethSpentOn3rdStage.mul(rate3))
        .add(ethSpentOn4thStage.mul(rate4))
        .add(value.mul(rate5));
        
      balanceAfter.should.be.bignumber.equal(amount);
    });

    it('should give correct amount of tokens in 5th stage', async function () {
      const value = ether(10);
      var goal1 = await ico.STAGE1_GOAL();
      var goal2 = await ico.STAGE2_GOAL();
      var goal3 = await ico.STAGE3_GOAL();
      var goal4 = await ico.STAGE4_GOAL();
      var goal5 = await ico.STAGE5_GOAL();
  
      var rate1 = await ico.STAGE1_RATE();
      var rate2 = await ico.STAGE2_RATE();
      var rate3 = await ico.STAGE3_RATE();
      var rate4 = await ico.STAGE4_RATE();
      var rate5 = await ico.STAGE5_RATE();
  
      (await token.balanceOf(otherWhitelistedWallet)).should.be.bignumber.equal(0);
  
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: goal5.sub(value), from: otherWhitelistedWallet })
        .should.be.fulfilled;
  
      var balanceAfter = await token.balanceOf(otherWhitelistedWallet);
  
      var ethSpentOn2ndStage = goal2.sub(goal1);
      var ethSpentOn3rdStage = goal3.sub(goal2);
      var ethSpentOn4thStage = goal4.sub(goal3);
      var ethSpentOn5thStage = goal5.sub(goal4).sub(value);
      var amount = goal1.mul(rate1)
        .add(ethSpentOn2ndStage.mul(rate2))
        .add(ethSpentOn3rdStage.mul(rate3))
        .add(ethSpentOn4thStage.mul(rate4))
        .add(ethSpentOn5thStage.mul(rate5));
        
      balanceAfter.should.be.bignumber.equal(amount);
    });
  
    it('should be able to purchase maximum amount of tokens', async function () {
      var goal1 = await ico.STAGE1_GOAL();
      var goal2 = await ico.STAGE2_GOAL();
      var goal3 = await ico.STAGE3_GOAL();
      var goal4 = await ico.STAGE4_GOAL();
      var goal5 = await ico.STAGE5_GOAL();
  
      var rate1 = await ico.STAGE1_RATE();
      var rate2 = await ico.STAGE2_RATE();
      var rate3 = await ico.STAGE3_RATE();
      var rate4 = await ico.STAGE4_RATE();
      var rate5 = await ico.STAGE5_RATE();
  
      (await token.balanceOf(otherWhitelistedWallet)).should.be.bignumber.equal(0);
  
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: goal5, from: otherWhitelistedWallet })
        .should.be.fulfilled;
  
      var balanceAfter = await token.balanceOf(otherWhitelistedWallet);
  
      var ethSpentOn2ndStage = goal2.sub(goal1);
      var ethSpentOn3rdStage = goal3.sub(goal2);
      var ethSpentOn4thStage = goal4.sub(goal3);
      var ethSpentOn5thStage = goal5.sub(goal4);
      var amount = goal1.mul(rate1)
        .add(ethSpentOn2ndStage.mul(rate2))
        .add(ethSpentOn3rdStage.mul(rate3))
        .add(ethSpentOn4thStage.mul(rate4))
        .add(ethSpentOn5thStage.mul(rate5));
        
      balanceAfter.should.be.bignumber.equal(amount);
    });

    it('should not be able to purchase more tokens than maximum goal', async function () {
      const value = ether(1);
      var goal5 = await ico.STAGE5_GOAL();
  
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: goal5.add(value), from: otherWhitelistedWallet })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should reject payment with amount < ' + minLimit, async function () {
      await increaseTimeTo(openingTime);
      await ico.buyTokens(otherWhitelistedWallet, { value: ether(0), from: otherWhitelistedWallet })
        .should.be.rejectedWith(EVMRevert);
      await ico.buyTokens(otherWhitelistedWallet, { value: ether(minLimit - 0.01), from: otherWhitelistedWallet })
        .should.be.rejectedWith(EVMRevert);
      await ico.buyTokens(otherWhitelistedWallet, { value: ether(minLimit), from: otherWhitelistedWallet })
        .should.be.fulfilled;
      await ico.buyTokens(otherWhitelistedWallet, { value: ether(minLimit + 0.01), from: otherWhitelistedWallet })
        .should.be.fulfilled;
      await ico.buyTokens(otherWhitelistedWallet, { value: ether(1), from: otherWhitelistedWallet })
        .should.be.fulfilled;
      await ico.buyTokens(otherWhitelistedWallet, { value: ether(11), from: otherWhitelistedWallet })
        .should.be.fulfilled;
    });
  });

  describe('after closed', function () {
    it('should be closed', async function () {
      await increaseTimeTo(afterClosingTime);
      (await ico.ended()).should.be.equal(true);
    });

    it('should not accept non-whitelisted payments after end', async function () {
      const value = ether(1);

      await increaseTimeTo(afterClosingTime);
      await ico.send(value).should.be.rejectedWith(EVMRevert);
      await ico.buyTokens(otherNotWhitelistedWallet, { from: otherNotWhitelistedWallet, value: value })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should not accept whitelisted payments after end', async function () {
      const value = ether(1);

      await increaseTimeTo(afterClosingTime);
      await ico.send(value).should.be.rejectedWith(EVMRevert);
      await ico.buyTokens(otherWhitelistedWallet, { from: otherWhitelistedWallet, value: value })
        .should.be.rejectedWith(EVMRevert);
    });

    it('cannot be finalized by third party after ending', async function () {
      await increaseTimeTo(afterClosingTime);
      await ico.finalize({ from: otherNotWhitelistedWallet }).should.be.rejectedWith(EVMRevert);
      await ico.finalize({ from: otherWhitelistedWallet }).should.be.rejectedWith(EVMRevert);
    });

    it('should finalize if initialized', async function () {
      await increaseTimeTo(afterClosingTime);

      (await ico.initialized()).should.be.equal(true);
      await ico.finalize().should.be.fulfilled;
    });

    it('should finalize', async function () {
      await increaseTimeTo(afterClosingTime);
      await ico.finalize().should.be.fulfilled;
    });

    it('cannot be finalized twice', async function () {
      await increaseTimeTo(afterClosingTime);
      await ico.finalize().should.be.fulfilled;
      await ico.finalize().should.be.rejectedWith(EVMRevert);
    });

    it('token should be unpaused after finalize', async function () {
      await increaseTimeTo(afterClosingTime);
      await ico.finalize().should.be.fulfilled;
      (await token.paused()).should.be.equal(false);
    });

    it('should transfer token ownership to owner', async function () {
      await increaseTimeTo(afterClosingTime);
        
      (await ico.owner()).should.be.equal(ownerWallet);
      (await token.owner()).should.be.equal(ico.address);
    
      await ico.finalize().should.be.fulfilled;
    
      (await ico.owner()).should.be.equal(ownerWallet);
      (await token.owner()).should.be.equal(ownerWallet);
    });

    it('unsold tokens should be burned (not minted)', async function () {
      await increaseTimeTo(openingTime);

      const value = ether(1);
      await ico.buyTokens(otherWhitelistedWallet, { value: value, from: otherWhitelistedWallet })
        .should.be.fulfilled;
      
      var tokensSold = await ico.tokensSold();
           
      await increaseTimeTo(afterClosingTime);
      await ico.finalize().should.be.fulfilled;

      var tokensSoldAfter = await ico.tokensSold();

      tokensSold.should.be.bignumber.equal(tokensSoldAfter);
    });

    it('should be able to transfer tokens', async function () {
      await increaseTimeTo(openingTime);
      const value = ether(1);
      await ico.buyTokens(otherWhitelistedWallet, { value: value, from: otherWhitelistedWallet })
        .should.be.fulfilled;

      await increaseTimeTo(afterClosingTime);
      await ico.finalize().should.be.fulfilled;

      var quantity = 150;

      var otherBalanceBefore = await token.balanceOf(otherNotWhitelistedWallet);
      await token.transfer(otherNotWhitelistedWallet, quantity, { from: otherWhitelistedWallet }).should.be.fulfilled;
      var otherBalanceAfter = await token.balanceOf(otherNotWhitelistedWallet);

      otherBalanceBefore.add(quantity).should.be.bignumber.equal(otherBalanceAfter);

      var balanceBeforeResend = await token.balanceOf(otherWhitelistedWallet);
      await token.transfer(otherWhitelistedWallet, quantity, { from: otherNotWhitelistedWallet }).should.be.fulfilled;
      var balanceAfterResend = await token.balanceOf(otherWhitelistedWallet);

      balanceBeforeResend.add(quantity).should.be.bignumber.equal(balanceAfterResend);
    });

    it('should not be able to mint tokens', async function () {
      await increaseTimeTo(afterClosingTime);
      await ico.finalize().should.be.fulfilled;

      await token.mint(otherWhitelistedWallet, 500).should.be.rejectedWith(EVMRevert);
    });

    it('should allow refunds if goal was not reached', async function () {
      await increaseTimeTo(openingTime);
      var balanceBefore = web3.eth.getBalance(otherWhitelistedWallet);
      const value = ether(1);
      await ico.buyTokens(otherWhitelistedWallet, { value: value, from: otherWhitelistedWallet, gasPrice: 0 })
        .should.be.fulfilled;

      await increaseTimeTo(afterClosingTime);
      await ico.finalize().should.be.fulfilled;
      await ico.claimRefund({ from: otherWhitelistedWallet, gasPrice: 0 }).should.be.fulfilled;

      var balanceAfter = web3.eth.getBalance(otherWhitelistedWallet);
      balanceBefore.should.be.bignumber.equal(balanceAfter);
    });

    it('should deny refunds if goal was reached', async function () {
      await increaseTimeTo(openingTime);
      var goal = await ico.GOAL();

      await ico.buyTokens(otherWhitelistedWallet, { value: goal, from: otherWhitelistedWallet })
        .should.be.fulfilled;
      (await ico.goalReached()).should.be.equal(true);

      await increaseTimeTo(afterClosingTime);
      await ico.finalize().should.be.fulfilled;
      await ico.claimRefund({ from: otherWhitelistedWallet }).should.be.rejectedWith(EVMRevert);
    });
  });
});
