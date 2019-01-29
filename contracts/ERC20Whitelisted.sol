pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol";


contract ERC20Whitelisted is ERC20, WhitelistedRole {
  function transfer(address to, uint256 value) public onlyWhitelisted returns (bool) {
    return super.transfer(to, value);
  }

  function transferFrom(address from, address to, uint256 value) public onlyWhitelisted returns (bool) {
    return super.transferFrom(from, to, value);
  }

  function approve(address spender, uint256 value) public onlyWhitelisted returns (bool) {
    return super.approve(spender, value);
  }

  function increaseAllowance(address spender, uint addedValue) public onlyWhitelisted returns (bool success) {
    return super.increaseAllowance(spender, addedValue);
  }

  function decreaseAllowance(address spender, uint subtractedValue) public onlyWhitelisted returns (bool success) {
    return super.decreaseAllowance(spender, subtractedValue);
  }
}