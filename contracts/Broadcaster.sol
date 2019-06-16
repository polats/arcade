pragma solidity ^0.5.0;

contract Broadcaster {
  constructor() public {
    emit Broadcast(now,"Contract Created!");
  }
  function broadcast(string memory output) public returns (bool){
    emit Broadcast(now,output);
    return true;
  }
  event Broadcast(uint timestamp, string output);
}
