export default class WorldGrid {
  constructor(scene, tileCount, tileSize, tiles) {
    this.scene = scene;
    this.tileCount = tileCount;
    this.tileSize = tileSize;
    this.gridSize = tileCount * tileSize;
    this.tiles = tiles;
    this.gridMeshes = [];
    this.blocks = new Map(); // Track blocks placed on the grid
  }

  async initialize() {
    // Load materials for all tiles
    await Promise.all(this.tiles.map(tile => tile.loadMaterials()));

    // Build the grid
    for (let x = 0; x < this.tileCount; x++) {
      for (let z = 0; z < this.tileCount; z++) {
        const tile = this.tiles[0]; // Default to the first tile type (e.g., grass)
        const mesh = tile.createMesh(this.tileSize, x, z, this.gridSize);
        this.scene.add(mesh);
        this.gridMeshes.push(mesh);
      }
    }
  }

  placeTile(mesh, tileType) {
    const tile = this.tiles.find(t => t.type === tileType);
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
    mesh.userData.type = tile.type;
  }

  placeBlock(block, x, z) {
    const blockKey = `${x},${z}`;
    if (this.blocks.has(blockKey)) return; // Prevent placing multiple blocks on the same tile

    const mesh = block.createMesh(this.tileSize, x, z, this.gridSize);
    this.scene.add(mesh);
    this.blocks.set(blockKey, mesh);
  }

  getMeshes() {
    return this.gridMeshes;
  }
}
