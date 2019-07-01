import * as React from 'react';
import deepmerge from 'deepmerge';
import remixLib from 'remix-lib';
import * as $ from 'jquery';
import async from 'async';
import MultiParamManager from './multiParamManager';
import * as ethJSUtil from 'ethereumjs-util';

let defaultConfig = {
  DEBUG: false,
  hide: true
}

var txHelper = remixLib.execution.txHelper
var executionContext = remixLib.execution.executionContext
var typeConversion = remixLib.execution.typeConversion
var txExecution = remixLib.execution.txExecution
var txFormat = remixLib.execution.txFormat
var TxRunner = remixLib.execution.txRunner
var EventManager = remixLib.EventManager
var Storage = remixLib.Storage

var Config = require('./config')
var registry = require('./global/registry')

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

      this.transactionContextAPI = {
        getAddress: (cb) => {
          cb(null, this.props.account)
        },
        getValue: (cb) => {
          cb(null, 0)
        },
        getGasLimit: (cb) => {
          cb(null, executionContext.currentblockGasLimit())
        }
      }

      this.event = new EventManager()

      var self = this
      self._components = {}
      registry.put({api: self, name: 'app'})

      var configStorage = new Storage('config-v0.8:')
      registry.put({api: configStorage, name: 'configStorage'})

      self._components.config = new Config(configStorage)
      registry.put({api: self._components.config, name: 'config'})

      this._deps = {
        config: registry.get('config').api
      }

      this._txRunnerAPI = {
        config: this._deps.config,
        detectNetwork: (cb) => {
          executionContext.detectNetwork(cb)
        },
        personalMode: () => {
          return executionContext.getProvider() === 'web3' ? this._deps.config.get('settings/personal-mode') : false
        }
      }

      this.txRunner = new TxRunner({}, this._txRunnerAPI)

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

      if (this.state.config.DEBUG) console.log(contractABI);

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
      var self = this
      var lookupOnly = args.funABI.constant

      function getInputs (funABI) {
        if (!funABI.inputs) {
          return ''
        }
        return txHelper.inputParametersDeclarationToString(funABI.inputs)
      }

      function clickButton (valArr, inputsValues) {
        var logMsg
        if (!args.funABI.constant) {
          logMsg = `transact to ${args.contractName}.${(args.funABI.name) ? args.funABI.name : '(fallback)'}`
        } else {
          logMsg = `call to ${args.contractName}.${(args.funABI.name) ? args.funABI.name : '(fallback)'}`
        }

        var value = inputsValues

        // contractsDetails is used to resolve libraries
        txFormat.buildData(args.contractName, args.contractAbi, {}, false, args.funABI, args.funABI.type !== 'fallback' ? value : '', (error, data) => {
          if (!error) {
            if (self.state.config.DEBUG) {
              if (!args.funABI.constant) {
                console.log(logMsg + "  pending ... ");
              } else {
                console.log(logMsg);
              }
            }

            if (args.funABI.type === 'fallback') data.dataHex = value
            self.callFunction(args.address, data, args.funABI, (error, txResult) => {
              if (self.state.config.DEBUG) {
                if (!error) {
                  var isVM = executionContext.isVM()
                  if (isVM) {
                    var vmError = txExecution.checkVMError(txResult)
                    if (vmError.error) {
                      console.log(logMsg + "  errored: " + vmError.message);
                      return
                    }
                  }
                  if (lookupOnly) {
                    console.log(executionContext.isVM() ?
                                txResult.result.vm.return :
                                txFormat.decodeResponse(ethJSUtil.toBuffer(txResult.result), args.funABI))
                  }
                } else {
                  console.log(error);
                }
              }
            })
          } else {
            console.log(logMsg + "  errored: " + error);
          }

        }, (msg) => {
          console.log(msg);

        }, (data, runTxCallback) => {
          console.log(data);
          // called for libraries deployment
          self.runTx(data, runTxCallback)
        })
      }

      var multiParamManager = new MultiParamManager(lookupOnly, args.funABI, (valArray, inputsValues, domEl) => {
        clickButton(valArray, inputsValues, domEl)
      }, getInputs(args.funABI))

      return multiParamManager.render()
    }

    callFunction (to, data, funAbi, callback) {
      this.runTx({to: to, data: data, useCall: funAbi.constant}, (error, txResult) => {
        callback(error, txResult)
      })
    }

    runTx (args, cb) {
      const self = this
      async.waterfall([
        function getGasLimit (next) {
          if (self.transactionContextAPI.getGasLimit) {
            return self.transactionContextAPI.getGasLimit(next)
          }
          next(null, 3000000)
        },
        function queryValue (gasLimit, next) {
          if (args.value) {
            return next(null, args.value, gasLimit)
          }
          if (args.useCall || !self.transactionContextAPI.getValue) {
            return next(null, 0, gasLimit)
          }
          self.transactionContextAPI.getValue(function (err, value) {
            next(err, value, gasLimit)
          })
        },
        function getAccount (value, gasLimit, next) {
          if (args.from) {
            return next(null, args.from, value, gasLimit)
          }
          if (self.transactionContextAPI.getAddress) {
            return self.transactionContextAPI.getAddress(function (err, address) {
              next(err, address, value, gasLimit)
            })
          }
          self.getAccounts(function (err, accounts) {
            let address = accounts[0]

            if (err) return next(err)
            if (!address) return next('No accounts available')
            if (executionContext.isVM() && !self.accounts[address]) {
              return next('Invalid account selected')
            }
            next(null, address, value, gasLimit)
          })
        },
        function runTransaction (fromAddress, value, gasLimit, next) {
          var tx = { to: args.to, data: args.data.dataHex, useCall: args.useCall, from: fromAddress, value: value, gasLimit: gasLimit, timestamp: args.data.timestamp }
          var payLoad = { funAbi: args.data.funAbi, funArgs: args.data.funArgs, contractBytecode: args.data.contractBytecode, contractName: args.data.contractName, contractABI: args.data.contractABI, linkReferences: args.data.linkReferences }
          var timestamp = Date.now()
          if (tx.timestamp) {
            timestamp = tx.timestamp
          }

          // self.event.trigger('initiatingTransaction', [timestamp, tx, payLoad])
          self.txRunner.rawRun(tx,
            (network, tx, gasEstimation, continueTxExecution, cancelCb) => { continueTxExecution() },
            (error, continueTxExecution, cancelCb) => { if (error) { cb(error) } else { continueTxExecution() } },
            (okCb, cancelCb) => { okCb() },
            function (error, result) {


              console.log(
                  txFormat.decodeResponse(ethJSUtil.toBuffer(
                      tx.useCall ? result.result : result), args.data.funAbi))

              let eventName = (tx.useCall ? 'callExecuted' : 'transactionExecuted')
              self.event.trigger(eventName, [error, tx.from, tx.to, tx.data, tx.useCall, result, timestamp, payLoad])

              if (error && (typeof (error) !== 'string')) {
                console.log("errored: " + error);
                if (error.message) error = error.message
                else {
                  try { error = 'error: ' + JSON.stringify(error) } catch (e) {}
                }
              }
              next(error, result)
            }
          )
        }
      ], cb)
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
