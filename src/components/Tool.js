export default class Tool {
  constructor(type, icon, name) {
    this.type = type;
    this.icon = icon;
    this.name = name;
  }

  use() {
    // Define tool-specific behavior here
    console.log(`Using tool: ${this.name}`);
  }
}
