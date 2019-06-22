import * as React from 'react';
import deepmerge from 'deepmerge';
import remixLib from 'remix-lib';

let defaultConfig = {
  DEBUG: true,
  hide: true
}

var txHelper = remixLib.execution.txHelper


export class ArcadeContractLoader extends React.Component {

    constructor(props) {
      super(props);

      let config = defaultConfig
      if(props.config) {
        config = deepmerge(config, props.config)
      }
      this.state = {
        config: config,
        contracts: {}
      }
    }

    getAddressFromJson(contractJson, networkId)
    {
      var contractNetworks = contractJson.networks;

      if (contractNetworks[networkId] !== undefined)
        return (contractNetworks[networkId].address)
    }

    getInputs (funABI) {
      if (!funABI.inputs) {
        return ''
      }
      return txHelper.inputParametersDeclarationToString(funABI.inputs)
    }


    async loadContract(contractObject) {
      var resultingContract = contractObject

      try {

        let address = this.getAddressFromJson(contractObject, await this.props.web3.eth.net.getId())
        let contract = new this.props.web3.eth.Contract(contractObject.abi, address)

        resultingContract = contract.methods
        resultingContract._address = address
        resultingContract._abi = contractObject.abi

      }
      catch(e) {
        console.log("ERROR LOADING CONTRACT "+contractObject,e)
      }

      return resultingContract
    }



    async componentDidMount() {
      let {contracts} = this.props
      let contractList = Object.getOwnPropertyNames(contracts)
      let loadedContracts = {}

      for(var i = 0; i < contractList.length; i++){

        var name = contractList[i];

        // ignore __esModule and Migrations
        if (name === '__esModule' || name === 'Migrations')
          continue;

          // load contracts via web3
        loadedContracts[name] = await this.loadContract(contracts[name]);
      }


      this.setState({
        contracts: loadedContracts
      })

    }

    createUIfromABI(abi) {
      return (
        <div key={"abi"+abi.name} style={{margin:5,padding:5}}>
        <button>{abi.name}</button>
        <input title={this.getInputs(abi)} placeholder={this.getInputs(abi)}>

        </input>
        </div>
      )
    }

    render(){

      if(this.state.config.hide){
        return false
      } else {
        let contractDisplay = []
        if(this.state.contracts){
          for(let c in this.state.contracts){
            let address = this.state.contracts[c]._address
            if (address)
            {
              contractDisplay.push(
                <div key={"contract"+c} style={{margin:5,padding:5}}>
                  {c} ({address})
                </div>
              )
              let abi = this.state.contracts[c]._abi
              console.log(abi)
              for (var i = 0; i < abi.length; i++)
              {
                let f = abi[i]
                contractDisplay.push(this.createUIfromABI(f))
              }
            }
          }
        }else {
          contractDisplay = "Loading..."
        }
        return (
          <div style={{padding:10}}>
            <b>Contracts</b>
            {contractDisplay}
          </div>
        )
      }
    }

}
