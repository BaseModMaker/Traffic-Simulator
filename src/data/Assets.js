import Interact from '../gameobjects/tools/Interact';
import Road from '../gameobjects/tiles/Road';
import Grass from '../gameobjects/tiles/Grass';
import Ammo from '../gameobjects/blocks/Ammo';
import Saloon from '../gameobjects/blocks/Saloon';
import Engineer from '../gameobjects/stickers/Engineer';
import Sniper from '../gameobjects/stickers/Sniper';
import ShellbackSentinel from '../gameobjects/stickers/ShellbackSentinel';
import ClanketteThePatchsmith from '../gameobjects/stickers/ClanketteThePatchsmith';

export const TOOLS = [new Interact()];
export const TILES = [new Road(), new Grass()];
export const BLOCKS = [new Ammo(), new Saloon()];
export const STICKERS = [
  new Engineer(),
  new Sniper(),
  new ShellbackSentinel(),
  new ClanketteThePatchsmith()
];
