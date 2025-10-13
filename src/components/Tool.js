export default class Tool {
  constructor(name) {
    this.name = name.toLowerCase();
    this.image = process.env.PUBLIC_URL + '/assets/tools/' + this.name + '.png';
  }

  use() {
    // Define tool-specific behavior here
    console.log(`Using tool: ${this.name}`);
  }
}
