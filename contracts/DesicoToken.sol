pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Capped.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol";


contract DesicoToken is ERC20, ERC20Detailed, ERC20Capped, ERC20Pausable, ERC20Burnable, WhitelistedRole, Ownable {
  uint private constant INITIAL_SUPPLY = 38575472;

  constructor() public
    ERC20Detailed("Desico", "DESI", 0)
    ERC20Capped(INITIAL_SUPPLY)
    ERC20Pausable()
    ERC20Burnable()
    ERC20()
  {
    pause();
  }

  function redeem(address account, uint256 value) public onlyOwner {
    require(account != address(0), "invalid address");

    _burn(account, value);
  }

  function transfer(address to, uint256 value) public onlyWhitelisted returns (bool) {
    require(isWhitelisted(to), "address not whitelisted");

    return super.transfer(to, value);
  }

  function transferFrom(address from, address to, uint256 value) public onlyWhitelisted returns (bool) {
    require(isWhitelisted(from), "address not whitelisted");
    require(isWhitelisted(to), "address not whitelisted");

    return super.transferFrom(from, to, value);
  }

  function approve(address spender, uint256 value) public onlyWhitelisted returns (bool) {
    require(isWhitelisted(spender), "address not whitelisted");

    return super.approve(spender, value);
  }

  function increaseAllowance(address spender, uint addedValue) public onlyWhitelisted returns (bool success) {
    require(isWhitelisted(spender), "address not whitelisted");

    return super.increaseAllowance(spender, addedValue);
  }

  function decreaseAllowance(address spender, uint subtractedValue) public onlyWhitelisted returns (bool success) {
    require(isWhitelisted(spender), "address not whitelisted");

    return super.decreaseAllowance(spender, subtractedValue);
  }
}