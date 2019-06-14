import React from 'react';
import ComponentSuperClass, {PackageClass} from './package';
import axios from 'axios';

class Demo extends ComponentSuperClass {
  constructor(props) {
    super(props);

    this.state = {
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
    return (
      <div>
        Hello!
        <div>
          {this.state.msg}
        </div>
      </div>
    );
  }
}

export default Demo;
