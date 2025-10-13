import Grass from "../gameobjects/tiles/Grass";

export default class WorldGrid {
  constructor(scene, tileCount, tileSize, tiles) {
    this.scene = scene;
    this.tileCount = tileCount;
    this.tileSize = tileSize;
    this.gridSize = tileCount * tileSize;
    this.tiles = tiles;
    this.gridMeshes = [];
    this.blocks = new Map(); // Track blocks placed on the grid
    this.stickers = new Map(); // Track stickers placed on the grid
  }

  async initialize() {
    // Load materials for all tiles
    await Promise.all(this.tiles.map(tile => tile.loadMaterials()));

    // Find the grass tile
    const grassTile = this.tiles.find(tile => tile.name === Grass.name.toLowerCase());
    if (!grassTile) {
      console.error('Grass tile not found in the tiles array.');
      return;
    }

    // Build the grid with grass tiles
    for (let x = 0; x < this.tileCount; x++) {
      for (let z = 0; z < this.tileCount; z++) {
        const mesh = grassTile.createMesh(this.tileSize, x, z, this.gridSize);
        this.scene.add(mesh);
        mesh.receiveShadow = true; // Enable receiving shadows for tiles
        this.gridMeshes.push(mesh);
      }
    }
  }

  placeTile(mesh, tileName) {
    const tile = this.tiles.find(t => t.name === tileName);
    if (!tile) return;

    // Remove any block on this tile
    const blockKey = `${mesh.userData.x},${mesh.userData.z}`;
    if (this.blocks.has(blockKey)) {
      const block = this.blocks.get(blockKey);
      this.scene.remove(block);
      this.blocks.delete(blockKey);
    }

    // Apply the tile material
    mesh.material = tile.material.clone();
    mesh.userData.baseMaterial = tile.material.clone();
    mesh.userData.highlightMaterial = tile.highlightMaterial.clone();
    mesh.userData.name = tile.name;
  }

  placeBlock(block, x, z) {
    const blockKey = `${x},${z}`;
    if (this.blocks.has(blockKey)) return; // Prevent placing multiple blocks on the same tile

    const mesh = block.createMesh(this.tileSize, x, z, this.gridSize);
    this.scene.add(mesh);
    this.blocks.set(blockKey, mesh);

    // Update the tile's userData with the block reference
    const tile = this.gridMeshes.find(t => t.userData.x === x && t.userData.z === z);
    if (tile) {
      tile.userData.block = block;
    }
  }

  placeSticker(mesh, x, z) {
    const stickerKey = `${x},${z}`;
    if (this.stickers.has(stickerKey)) {
      const { mesh: existingMesh } = this.stickers.get(stickerKey);
      this.scene.remove(existingMesh);
      this.stickers.delete(stickerKey);
    }

    this.stickers.set(stickerKey, { mesh });

    // Update the tile's userData with the sticker reference
    const tile = this.gridMeshes.find(t => t.userData.x === x && t.userData.z === z);
    if (tile) {
      tile.userData.sticker = { name: mesh.userData.name };
    }
  }

  getMeshes() {
    return this.gridMeshes;
  }

  getTilesWithinRadius(centerX, centerZ, radius) {
    return this.gridMeshes.filter(tile => {
      const { x, z } = tile.userData;
      const distance = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
      return distance <= radius;
    });
  }
}
