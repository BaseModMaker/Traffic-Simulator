import Tool from '../../components/Tool';

export default class Interact extends Tool {
  constructor() {
    super(Interact.name);
  }

  use() {
    console.log('Interacting with the environment...');
  }
}
