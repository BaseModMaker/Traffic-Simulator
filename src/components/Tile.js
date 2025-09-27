import * as THREE from 'three';

export default class Tile {
  constructor(type, icon, name, texturePath) {
    this.type = type;
    this.icon = icon;
    this.name = name;
    this.texturePath = texturePath;
    this.material = null;
    this.highlightMaterial = null;
  }

  async loadMaterials() {
    const loader = new THREE.TextureLoader();
    const texture = await new Promise((resolve, reject) => {
      loader.load(
        this.texturePath,
        resolve,
        undefined,
        reject
      );
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.NearestFilter;

    this.material = new THREE.MeshLambertMaterial({ map: texture });
    this.highlightMaterial = new THREE.MeshLambertMaterial({
      map: texture,
      side: THREE.DoubleSide,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
    });
  }

  createMesh(tileSize, x, z, gridSize) {
    const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
    const mesh = new THREE.Mesh(geometry, this.material.clone());
    mesh.position.x = x * tileSize - gridSize / 2 + tileSize / 2;
    mesh.position.z = z * tileSize - gridSize / 2 + tileSize / 2;
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData = {
      baseMaterial: mesh.material,
      highlightMaterial: this.highlightMaterial.clone(),
      type: this.type,
      isTile: true,
      x,
      z,
    };
    return mesh;
  }
}
