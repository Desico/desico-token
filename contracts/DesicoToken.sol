pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";


contract DesicoToken is ERC20, ERC20Detailed, ERC20Pausable, ERC20Burnable {
  uint private initialSupply = 1023018;

  constructor() public
    ERC20Detailed("Desico", "DESI", 0)
    ERC20Pausable()
    ERC20Burnable()
    ERC20()
  {
    _mint(msg.sender, initialSupply);
  }
}