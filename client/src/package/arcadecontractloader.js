import * as React from 'react';

export class ArcadeContractLoader extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
        contracts: {}
      }
    }

    componentDidMount() {
      let {contracts} = this.props
      let contractList = Object.getOwnPropertyNames(contracts)
      let loadedContracts = {}

      for(var i = 0; i < contractList.length; i++){

        var name = contractList[i];

        // ignore __esModule and Migrations
        if (name === '__esModule' || name === 'Migrations')
          continue;

        loadedContracts[name] = contracts[name];
        // load web3 contract and render status
      }

      this.setState({
        contracts: loadedContracts
      })

    }

    render() {
        return null;
    }

}
