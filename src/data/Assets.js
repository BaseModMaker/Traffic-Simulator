import Tool from '../components/Tool';
import Tile from '../components/Tile';
import Block from '../components/Block';
import Sticker from '../components/Sticker';

export const TOOLS = [
  new Tool('interact', process.env.PUBLIC_URL + '/assets/tiles/interact.png', 'Interact Tool')
];

export const TILES = [
  new Tile('road', process.env.PUBLIC_URL + '/assets/tiles/road.png', 'Road', process.env.PUBLIC_URL + '/assets/tiles/road.png'),
  new Tile('grass', process.env.PUBLIC_URL + '/assets/tiles/grass.png', 'Grass', process.env.PUBLIC_URL + '/assets/tiles/grass.png')
];

export const BLOCKS = [
  new Block('ammo', process.env.PUBLIC_URL + '/assets/blocks/ammo-icon.png'),
  new Block('saloon', process.env.PUBLIC_URL + '/assets/blocks/saloon.jpg')
];

export const STICKERS = [
  new Sticker('engineer', process.env.PUBLIC_URL + '/assets/stickers/engineer.png', process.env.PUBLIC_URL + '/assets/stickers/engineer.png'),
];
