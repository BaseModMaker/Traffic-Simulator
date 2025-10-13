import * as THREE from 'three';

export default class Tile {
  constructor(name) {
    this.name = name.toLowerCase();
    this.image = process.env.PUBLIC_URL + '/assets/tiles/' + this.name + '.png';
    this.material = null;
    this.highlightMaterial = null;
  }

  async loadMaterials() {
    const loader = new THREE.TextureLoader();
    const texture = await new Promise((resolve, reject) => {
      loader.load(
        this.image,
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

    this.material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8, // Adjust roughness for less shine
      metalness: 0.0  // No metallic effect
    });
    this.highlightMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
      roughness: 0.8,
      metalness: 0.0
    });
  }

  createMesh(tileSize, x, z, gridSize) {
    const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
    const mesh = new THREE.Mesh(geometry, this.material.clone());
    mesh.position.x = x * tileSize - gridSize / 2 + tileSize / 2;
    mesh.position.z = z * tileSize - gridSize / 2 + tileSize / 2;
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true; // Enable receiving shadows
    mesh.userData = {
      baseMaterial: mesh.material,
      highlightMaterial: this.highlightMaterial.clone(),
      name: this.name,
      isTile: true,
      x,
      z,
    };
    return mesh;
  }
}

