import React from 'react';
import ComponentSuperClass, {PackageClass} from './package';

class Demo extends ComponentSuperClass {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div>
        Hello!
      </div>
    );
  }
}

export default Demo;
