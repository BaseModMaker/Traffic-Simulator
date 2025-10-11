export default class Tool {
  constructor(type, icon) {
    this.type = type;
    this.icon = icon;
    this.name = type;
  }

  use() {
    // Define tool-specific behavior here
    console.log(`Using tool: ${this.name}`);
  }
}
