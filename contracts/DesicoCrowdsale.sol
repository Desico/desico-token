pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "./DesicoToken.sol";


contract DesicoCrowdsale is CappedCrowdsale, MintedCrowdsale, RefundableCrowdsale, WhitelistedCrowdsale {
  
  uint256 private constant TOKEN_UNIT = 10 ** uint256(18);
  uint256 public constant TOTAL_SUPPLY = 409852000 * TOKEN_UNIT;

  uint256 public constant GOAL = 7500 ether;
  uint256 public constant MIN_LIMIT = 100 finney;

  uint256 public constant STAGE1_GOAL = 7500 ether;
  uint256 public constant STAGE2_GOAL = 11500 ether;
  uint256 public constant STAGE3_GOAL = 22500 ether;
  uint256 public constant STAGE4_GOAL = 33500 ether;
  uint256 public constant STAGE5_GOAL = 44000 ether;

  uint256 public constant RATE = 7900;
  uint256 public constant STAGE1_RATE = 10665; // RATE + 35%
  uint256 public constant STAGE2_RATE = 9875; // RATE + 25%
  uint256 public constant STAGE3_RATE = 9480; // RATE + 20%
  uint256 public constant STAGE4_RATE = 8848; // RATE + 12%
  uint256 public constant STAGE5_RATE = 8453; // RATE + 7%
  
  uint256 public tokensSold;
  bool public initialized = false;

  event Initialized();

  /**
  * Define pricing schedule using tranches.
  */
  struct Tranche {
    // Amount in weis when this tranche becomes active
    uint amount;
    // How many tokens per wei you will get while this tranche is active
    uint256 rate;
  }

  Tranche[5] private tranches;

  /**
   * @dev Reverts if not initialized.
   */
  modifier onlyIfInitialized {
    require(initialized);
    _;
  }

  function DesicoCrowdsale(
    uint256 _openingTime,
    uint256 _closingTime,
    address _wallet,
    address _token
  ) 
    public 
    Crowdsale(RATE, _wallet, DesicoToken(_token))
    TimedCrowdsale(_openingTime, _closingTime)
    CappedCrowdsale(TOTAL_SUPPLY)
    RefundableCrowdsale(GOAL)
  {
    tranches[0].amount = STAGE1_GOAL;
    tranches[0].rate = STAGE1_RATE;

    tranches[1].amount = STAGE2_GOAL;
    tranches[1].rate = STAGE2_RATE;

    tranches[2].amount = STAGE3_GOAL;
    tranches[2].rate = STAGE3_RATE;

    tranches[3].amount = STAGE4_GOAL;
    tranches[3].rate = STAGE4_RATE;

    tranches[4].amount = STAGE5_GOAL;
    tranches[4].rate = STAGE5_RATE;
  }

  function initialize() public onlyOwner {
    require(!initialized);

    DesicoToken(token).pause();
    emit Initialized();

    initialized = true;
  }

  function started() public view returns(bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp >= openingTime && initialized;
  }

  function ended() public view returns(bool) {
    return hasClosed() || capReached();
  }

  function amount(uint256 _weiAmount) public onlyIfInitialized view returns(uint256) {
    return _getTokenAmount(_weiAmount);
  }

  /**
   * @dev Overrides parent method
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal onlyIfInitialized {
    require(_weiAmount >= MIN_LIMIT);
    require(weiRaised.add(_weiAmount) <= STAGE5_GOAL);

    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

  /**
   * @dev Overrides parent method
   * @param _weiAmount The value in wei to be converted into tokens
   * @return The number of tokens _weiAmount wei will buy at present time
   */
  function _getTokenAmount(uint256 _weiAmount) internal onlyIfInitialized view returns (uint256) {
    require(_weiAmount >= MIN_LIMIT);
    require(weiRaised.add(_weiAmount) <= STAGE5_GOAL);
    
    uint256 _total = 0;
    uint256 _from = weiRaised;

    for (uint i = 1; i < tranches.length; i++) {
      uint _i = i.sub(1);

      if (_from <= tranches[_i].amount) {
        uint256 _rate1 = tranches[_i].rate;
        uint256 _rate2 = tranches[i].rate;
        uint256 _amount1 = tranches[_i].amount;
        uint256 _amount2 = tranches[i].amount;

        if (_from.add(_weiAmount) > _amount1) {
          uint256 _over = _from.add(_weiAmount).sub(_amount1);
          uint256 _value = _weiAmount.sub(_over);

         _from = _from.add(_value);
         _weiAmount = _weiAmount.sub(_value);

          _total = _total.add(_value.mul(_rate1));
          
          if (_from.add(_weiAmount) <= _amount2) {
            _total = _total.add(_over.mul(_rate2));
            break;
          }

        } else {
          _total = _total.add(_weiAmount.mul(_rate1));
          break;
        }
      }
    }

    return _total;
  }

  /**
   * @dev Overrides parent method
   * @param _beneficiary Address receiving the tokens
   * @param _tokenAmount Number of tokens to be purchased
   */
  function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    super._processPurchase(_beneficiary, _tokenAmount);

    tokensSold = tokensSold.add(_tokenAmount);
  }

  /**
   * @dev finalization task, called when owner calls finalize()
   */
  function finalization() internal onlyIfInitialized {
    DesicoToken(token).finishMinting();
    DesicoToken(token).unpause();
    DesicoToken(token).transferOwnership(owner);

    super.finalization();
  }
}