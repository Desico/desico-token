pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Capped.sol";
import "./ERC20Whitelisted.sol";


contract DesicoToken is ERC20, ERC20Detailed, ERC20Capped, ERC20Pausable, ERC20Burnable, ERC20Whitelisted {
  uint private constant INITIAL_SUPPLY = 1023018;

  constructor() public
    ERC20Detailed("Desico", "DESI", 0)
    ERC20Capped(INITIAL_SUPPLY)
    ERC20Pausable()
    ERC20Burnable()
    ERC20Whitelisted()
    ERC20()
  {
    pause();
  }
}