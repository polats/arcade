import React from 'react';
import Arcade, {ArcadeContractLoader} from './package';
import { Metamask, Gas, ContractLoader, Transactions, Events, Scaler, Blockie, Address, Button } from "dapparatus"
import axios from 'axios';
import Web3 from 'web3';

class Demo extends Arcade {
  constructor(props) {
    super(props);

    this.state = {
      web3: false,
      account: false,
      gwei: 4,
      doingTransaction: false,
      msg: "Waiting..."
    }

    this.getServerMessage();
  }

  async getServerMessage() {
    var resp = await axios.get("/hello");
    this.setState(
      resp.data
    )
  };

  render() {

    let {web3,account,contracts,tx,gwei,block,avgBlockTime,etherscan} = this.state
    let connectedDisplay = []
    if(web3){
      connectedDisplay.push(
       <Gas
         key="Gas"
         onUpdate={(state)=>{
           console.log("Gas price update:",state)
           this.setState(state,()=>{
             console.log("GWEI set:",this.state)
           })
         }}
       />
      )

      connectedDisplay.push(
        <ArcadeContractLoader
          config={{DEBUG:true, hide:false}}
          web3={web3}
          contracts={require(`${__dirname}/contracts`)}
        />
      )
    }

    return (
      <div>
      <div className="App">
        <Metamask
          config={{requiredNetwork:['Unknown','Rinkeby', 'Ropsten', 'Mainnet']}}
          onUpdate={(state)=>{
           console.log("metamask state update:",state)
           if(state.web3Provider) {
             state.web3 = new Web3(state.web3Provider)
             this.setState(state)
           }
          }}
        />
        {connectedDisplay}
      </div>
        Hello!
        <div>
          {this.state.msg}
        </div>
      </div>
    );
  }
}

export default Demo;
