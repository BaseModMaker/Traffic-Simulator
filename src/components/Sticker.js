import * as THREE from 'three'; 

export default class Sticker {

  constructor(type, texturePath) {
    this.type = type;
    this.icon = texturePath
    this.texturePath = texturePath;
    this.material = null;
  }

  async loadMaterial() {
    if (this.material) return;
    const loader = new THREE.TextureLoader();
    const texture = await new Promise((resolve, reject) => {
      loader.load(this.texturePath, resolve, undefined, reject);
    });

    this.material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide, // show both sides of the plane
      roughness: 0.8,         // Adjust roughness for less shine
      metalness: 0.0,         // No metallic effect
    });
  }

  async createMesh(tileSize, x, z, gridSize) {
    if (!this.material) {
      console.error(`Material for sticker "${this.type}" is not loaded. Ensure loadMaterial() is called and awaited.`);
      await this.loadMaterial();
    }

    // Plane that stands upright on the XZ grid
    const geometry = new THREE.PlaneGeometry(tileSize * 0.8, tileSize * 0.8);
    const mesh = new THREE.Mesh(geometry, this.material);

    mesh.position.set(
      x * tileSize - gridSize / 2 + tileSize / 2,
      tileSize * 0.4,   // slightly above the tile
      z * tileSize - gridSize / 2 + tileSize / 2
    );

    // Rotate so it is vertical (perpendicular to ground)
    mesh.rotation.x = 0;           // ensure no tilt

    // Add logic to rotate horizontally to face the camera
    mesh.onBeforeRender = (renderer, scene, camera) => {
      const cameraPosition = camera.position.clone();
      cameraPosition.y = mesh.position.y; // Lock the vertical axis
      mesh.lookAt(cameraPosition); // Rotate to face the camera horizontally
    };

    mesh.userData = { type: this.type, x, z };
    return { mesh };
  }
}
