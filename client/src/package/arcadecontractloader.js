import * as React from 'react';
import deepmerge from 'deepmerge';
import remixLib from 'remix-lib';
import * as $ from 'jquery';
import MultiParamManager from './multiParamManager';

let defaultConfig = {
  DEBUG: true,
  hide: true
}

var txHelper = remixLib.execution.txHelper
var executionContext = remixLib.execution.executionContext

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

    renderInstanceFromABI(contractABI, address, contractName) {
      let ret = []

      console.log(contractABI);

      $.each(contractABI, (i, funABI) => {
        if (funABI.type !== 'function') {
          return
        }

        ret.push(this.getCallButton(
          {
            funABI: funABI,
            address: address,
            contractAbi: contractABI,
            contractName: contractName
          }
          ));
      })

      return ret
    }

    getCallButton(args) {
      var lookupOnly = args.funABI.constant

      function getInputs (funABI) {
        if (!funABI.inputs) {
          return ''
        }
        return txHelper.inputParametersDeclarationToString(funABI.inputs)
      }

      function clickButton (valArr, inputsValues) {
        console.log(valArr, inputsValues);
        // var logMsg
        // if (!args.funABI.constant) {
        //   logMsg = `transact to ${args.contractName}.${(args.funABI.name) ? args.funABI.name : '(fallback)'}`
        // } else {
        //   logMsg = `call to ${args.contractName}.${(args.funABI.name) ? args.funABI.name : '(fallback)'}`
        // }
        //
        // var value = inputsValues
        //
        // var confirmationCb = (network, tx, gasEstimation, continueTxExecution, cancelCb) => {
        //   if (network.name !== 'Main') {
        //     return continueTxExecution(null)
        //   }
        //   var amount = executionContext.web3().fromWei(typeConversion.toInt(tx.value), 'ether')
        //   var content = confirmDialog(tx, amount, gasEstimation, self.udapp,
        //     (gasPrice, cb) => {
        //       let txFeeText, priceStatus
        //       // TODO: this try catch feels like an anti pattern, can/should be
        //       // removed, but for now keeping the original logic
        //       try {
        //         var fee = executionContext.web3().toBigNumber(tx.gas).mul(executionContext.web3().toBigNumber(executionContext.web3().toWei(gasPrice.toString(10), 'gwei')))
        //         txFeeText = ' ' + executionContext.web3().fromWei(fee.toString(10), 'ether') + ' Ether'
        //         priceStatus = true
        //       } catch (e) {
        //         txFeeText = ' Please fix this issue before sending any transaction. ' + e.message
        //         priceStatus = false
        //       }
        //       cb(txFeeText, priceStatus)
        //     },
        //     (cb) => {
        //       executionContext.web3().eth.getGasPrice((error, gasPrice) => {
        //         var warnMessage = ' Please fix this issue before sending any transaction. '
        //         if (error) {
        //           return cb('Unable to retrieve the current network gas price.' + warnMessage + error)
        //         }
        //         try {
        //           var gasPriceValue = executionContext.web3().fromWei(gasPrice.toString(10), 'gwei')
        //           cb(null, gasPriceValue)
        //         } catch (e) {
        //           cb(warnMessage + e.message, null, false)
        //         }
        //       })
        //     }
        //   )
        //   modalDialog('Confirm transaction', content,
        //     { label: 'Confirm',
        //       fn: () => {
        //         self.udapp._deps.config.setUnpersistedProperty('doNotShowTransactionConfirmationAgain', content.querySelector('input#confirmsetting').checked)
        //         // TODO: check if this is check is still valid given the refactor
        //         if (!content.gasPriceStatus) {
        //           cancelCb('Given gas price is not correct')
        //         } else {
        //           var gasPrice = executionContext.web3().toWei(content.querySelector('#gasprice').value, 'gwei')
        //           continueTxExecution(gasPrice)
        //         }
        //       }}, {
        //         label: 'Cancel',
        //         fn: () => {
        //           return cancelCb('Transaction canceled by user.')
        //         }
        //       })
        // }
        //
        // var continueCb = (error, continueTxExecution, cancelCb) => {
        //   if (error) {
        //     var msg = typeof error !== 'string' ? error.message : error
        //     modalDialog('Gas estimation failed', yo`<div>Gas estimation errored with the following message (see below).
        //     The transaction execution will likely fail. Do you want to force sending? <br>
        //     ${msg}
        //     </div>`,
        //       {
        //         label: 'Send Transaction',
        //         fn: () => {
        //           continueTxExecution()
        //         }}, {
        //           label: 'Cancel Transaction',
        //           fn: () => {
        //             cancelCb()
        //           }
        //         })
        //   } else {
        //     continueTxExecution()
        //   }
        // }
        //
        // var outputCb = (decoded) => {
        //   outputOverride.innerHTML = ''
        //   outputOverride.appendChild(decoded)
        // }
        //
        // var promptCb = (okCb, cancelCb) => {
        //   modalCustom.promptPassphrase('Passphrase requested', 'Personal mode is enabled. Please provide passphrase of account', '', okCb, cancelCb)
        // }
        //
        // // contractsDetails is used to resolve libraries
        // txFormat.buildData(args.contractName, args.contractAbi, {}, false, args.funABI, args.funABI.type !== 'fallback' ? value : '', (error, data) => {
        //   if (!error) {
        //     if (!args.funABI.constant) {
        //       self.registry.get('logCallback').api(`${logMsg} pending ... `)
        //     } else {
        //       self.registry.get('logCallback').api(`${logMsg}`)
        //     }
        //     if (args.funABI.type === 'fallback') data.dataHex = value
        //     self.udapp.callFunction(args.address, data, args.funABI, confirmationCb, continueCb, promptCb, (error, txResult) => {
        //       if (!error) {
        //         var isVM = executionContext.isVM()
        //         if (isVM) {
        //           var vmError = txExecution.checkVMError(txResult)
        //           if (vmError.error) {
        //             self.registry.get('logCallback').api(`${logMsg} errored: ${vmError.message} `)
        //             return
        //           }
        //         }
        //         if (lookupOnly) {
        //           var decoded = decodeResponseToTreeView(executionContext.isVM() ? txResult.result.vm.return : ethJSUtil.toBuffer(txResult.result), args.funABI)
        //           outputCb(decoded)
        //         }
        //       } else {
        //         self.registry.get('logCallback').api(`${logMsg} errored: ${error} `)
        //       }
        //     })
        //   } else {
        //     self.registry.get('logCallback').api(`${logMsg} errored: ${error} `)
        //   }
        // }, (msg) => {
        //   self.registry.get('logCallback').api(msg)
        // }, (data, runTxCallback) => {
        //   // called for libraries deployment
        //   self.udapp.runTx(data, confirmationCb, runTxCallback)
        // })
      }

      var multiParamManager = new MultiParamManager(lookupOnly, args.funABI, (valArray, inputsValues, domEl) => {
        clickButton(valArray, inputsValues, domEl)
      }, getInputs(args.funABI))

      return multiParamManager.render()
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
              contractDisplay.push(this.renderInstanceFromABI(abi, address, c))

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
