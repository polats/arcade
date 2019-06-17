import { Component } from 'react';
export * from './arcadecontractloader';

export default class Arcade extends Component {

    constructor(props) {
      super(props);
    }

    componentDidUpdate() {
      console.log(this.state);
    }

    async componentDidMount() {
      console.log(this.constructor.name + " componentDidMount");
    }

    render() {
      return null;
    }
}
