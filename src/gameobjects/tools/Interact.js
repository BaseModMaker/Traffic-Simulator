import Tool from '../../components/Tool';

export default class Interact extends Tool {
  constructor() {
    super('interact');
  }

  use(tile) {
    if (tile) {
      const { name, x, z, sticker, block } = tile.userData;
      if (sticker) {
        console.log(`Interacting with sticker: ${sticker.name} at (${x}, ${z})`);
      } else if (block) {
        console.log(`Interacting with block: ${block.name} at (${x}, ${z})`);
      } else {
        console.log(`Interacting with tile: ${name} at (${x}, ${z})`);
      }
    } else {
      console.log(`No tile selected for interaction.`);
    }
  }
}
