import * as THREE from 'three';

export default class Block {
  constructor(type, texturePath) {
    this.type = type;
    this.icon = texturePath;
    this.texturePath = texturePath;
    this.materials = null;
  }

  async loadMaterials() {
    const loader = new THREE.TextureLoader();
    const texture = await new Promise((resolve, reject) => {
      loader.load(this.texturePath, resolve, undefined, reject);
    });

    // Split the texture into four parts
    const size = 0.5;
    const materials = ['front', 'roof', 'side', 'back'].map((_, i) => {
      const offsetX = (i % 2) * size;
      const offsetY = i < 2 ? 0 : size;
      const subTexture = texture.clone();
      subTexture.offset.set(offsetX, offsetY);
      subTexture.repeat.set(size, size);
      return new THREE.MeshStandardMaterial({
        map: subTexture,
        roughness: 0.8, // Adjust roughness for less shine
        metalness: 0.0  // No metallic effect
      });
    });

    this.materials = {
      side: materials[0],
      back: materials[1],
      front: materials[2],
      roof: materials[3],
    };
  }

  createMesh(tileSize, x, z, gridSize) {
    const geometry = new THREE.BoxGeometry(tileSize, tileSize, tileSize);
    const mesh = new THREE.Mesh(geometry, [
      this.materials.side, // Left
      this.materials.side, // Right
      this.materials.roof, // Top
      this.materials.roof, // Bottom (not visible)
      this.materials.front, // Front
      this.materials.back, // Back
    ]);
    mesh.position.set(
      x * tileSize - gridSize / 2 + tileSize / 2,
      tileSize / 2, // Raise cube above the tile
      z * tileSize - gridSize / 2 + tileSize / 2
    );
    mesh.userData = { type: this.type, x, z };
    return mesh;
  }
}
