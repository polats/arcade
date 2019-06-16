const Broadcaster = artifacts.require("Broadcaster")
const truffleAssert = require('truffle-assertions')

contract("Broadcaster", accounts => {

  // assign accounts to roles
  var owner = accounts[0];

  it("message is emitted as an event", async () => {
    var broadcaster = await Broadcaster.deployed();
    var message = "Hello World!";

    var result = await broadcaster.broadcast(message, {from: owner});

    truffleAssert.eventEmitted(result, 'Broadcast', (ev) => {
        return ev.output === message;
    });
  });

});
