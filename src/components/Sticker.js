import * as THREE from 'three'; 

export default class Sticker {

  constructor(name) {
    this.name = name.toLowerCase();
    this.image = process.env.PUBLIC_URL + '/assets/stickers/' + this.name + '.png';
    this.material = null;
    this.health = 100; // Default health value
    this.maxHealth = 100; // Maximum health value
    this.healthBar = null; // Health bar mesh
  }

  async loadMaterial() {
    if (this.material) return;
    const loader = new THREE.TextureLoader();
    const texture = await new Promise((resolve, reject) => {
      loader.load(this.image, resolve, undefined, reject);
    });

    this.material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.5, // Use alpha channel for shadow shape
      side: THREE.DoubleSide, // Show both sides of the plane
      roughness: 0.8,         // Adjust roughness for less shine
      metalness: 0.0,         // No metallic effect
    });
  }

  async createMesh(tileSize, x, z, gridSize) {
    if (!this.material) {
      console.error(`Material for sticker "${this.name}" is not loaded. Ensure loadMaterial() is called and awaited.`);
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

    mesh.castShadow = true; // Enable casting shadows
    mesh.receiveShadow = true; // Enable receiving shadows
    mesh.userData = { name: this.name, x, z };

    // Create the health bar
    const healthBarGeometry = new THREE.PlaneGeometry(tileSize * 0.8, tileSize * 0.1);
    const healthBarMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00, // Green for full health
      transparent: true,
    });
    this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
    this.healthBar.position.set(0, tileSize * 0.5, 0); // Position above the sticker
    this.healthBar.rotation.x = -Math.PI / 2; // Align horizontally
    mesh.add(this.healthBar); // Attach health bar to the sticker mesh

    return { mesh };
  }

  updateHealth(newHealth) {
    this.health = Math.max(0, Math.min(newHealth, this.maxHealth)); // Clamp health between 0 and maxHealth
    if (this.healthBar) {
      const healthRatio = this.health / this.maxHealth;
      this.healthBar.scale.x = healthRatio; // Scale the health bar width
      this.healthBar.material.color.set(healthRatio > 0.5 ? 0x00ff00 : healthRatio > 0.2 ? 0xffff00 : 0xff0000); // Green, yellow, red
    }
  }
}
