pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/CappedToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol";


contract DesicoToken is DetailedERC20, PausableToken, CappedToken {

  uint256 private constant TOKEN_UNIT = 10 ** uint256(18);
  uint256 public constant TOTAL_SUPPLY = 803631373 * TOKEN_UNIT;
  
  uint256 public constant RESERVE_SUPPLY = 112508392 * TOKEN_UNIT;
  uint256 public constant ADVISORS_SUPPLY = 32145255 * TOKEN_UNIT;
  uint256 public constant BOUNTIES_SUPPLY = 24108941 * TOKEN_UNIT;
  uint256 public constant FINANCIAL_SUPPORTERS_SUPPLY = 64290510 * TOKEN_UNIT;
  uint256 public constant TEAM_SUPPLY = 80363138 * TOKEN_UNIT;
  uint256 public constant FOUNDATION_SUPPLY = 80363137 * TOKEN_UNIT;

  address private teamWallet;
  address private foundationWallet;

  mapping (address => TokenTimelock) private timelock;

  function DesicoToken(
    uint256 _releaseTime,
    address _teamWallet, 
    address _reserveWallet, 
    address _foundationWallet, 
    address _advisorsWallet, 
    address _bountiesWallet, 
    address _financialSupportersWallet
  ) 
    public 
    DetailedERC20("Desico", "DESI", 18)
    CappedToken(TOTAL_SUPPLY)
  {
    // solium-disable-next-line security/no-block-members
    require(_releaseTime >= block.timestamp);
    require(_teamWallet != address(0));
    require(_reserveWallet != address(0));
    require(_foundationWallet != address(0));
    require(_advisorsWallet != address(0));
    require(_bountiesWallet != address(0));
    require(_financialSupportersWallet != address(0));

    teamWallet = _teamWallet;
    foundationWallet = _foundationWallet;

    mint(_reserveWallet, RESERVE_SUPPLY);
    mint(_advisorsWallet, ADVISORS_SUPPLY);
    mint(_bountiesWallet, BOUNTIES_SUPPLY);
    mint(_financialSupportersWallet, FINANCIAL_SUPPORTERS_SUPPLY);

    mintAndLock(_teamWallet, TEAM_SUPPLY, _releaseTime);
    mintAndLock(_foundationWallet, FOUNDATION_SUPPLY, _releaseTime);
  }

  function withdraw() public {
    unlock(teamWallet);
    unlock(foundationWallet);
  }
  
  function mintAndLock(address to, uint256 amount, uint256 releaseTime) internal {
    timelock[to] = new TokenTimelock(this, to, releaseTime);
    mint(address(timelock[to]), amount);
  }

  function unlock(address to) internal {
    TokenTimelock t = timelock[to];
    t.release();
  }
}