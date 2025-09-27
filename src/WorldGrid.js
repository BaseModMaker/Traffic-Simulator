export default class WorldGrid {
  constructor(scene, tileCount, tileSize, tiles) {
    this.scene = scene;
    this.tileCount = tileCount;
    this.tileSize = tileSize;
    this.gridSize = tileCount * tileSize;
    this.tiles = tiles;
    this.gridMeshes = [];
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

    mesh.material = tile.material.clone();
    mesh.userData.baseMaterial = tile.material.clone();
    mesh.userData.highlightMaterial = tile.highlightMaterial.clone();
    mesh.userData.type = tile.type;
  }

  getMeshes() {
    return this.gridMeshes;
  }
}
