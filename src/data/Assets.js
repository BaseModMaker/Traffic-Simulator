import Tool from '../components/Tool';
import Tile from '../components/Tile';
import Block from '../components/Block';
import Sticker from '../components/Sticker';

export const TOOLS = [
  new Tool('interact', process.env.PUBLIC_URL + '/assets/tiles/interact.png')
];

export const TILES = [
  new Tile('road', process.env.PUBLIC_URL + '/assets/tiles/road.png'),
  new Tile('grass', process.env.PUBLIC_URL + '/assets/tiles/grass.png')
];

export const BLOCKS = [
  new Block('ammo', process.env.PUBLIC_URL + '/assets/blocks/ammo-icon.png'),
  new Block('saloon', process.env.PUBLIC_URL + '/assets/blocks/saloon.jpg')
];

export const STICKERS = [
  new Sticker('engineer', process.env.PUBLIC_URL + '/assets/stickers/engineer.png'),
  new Sticker('sniper', process.env.PUBLIC_URL + '/assets/stickers/sniper.png'),
  new Sticker('shellback sentinel', process.env.PUBLIC_URL + '/assets/stickers/shellback sentinel.png'),
  new Sticker('Clankette the Patchsmith', process.env.PUBLIC_URL + '/assets/stickers/Clankette the Patchsmith.png')
];
