import * as THREE from 'three';
import spritestack from './Spritestack';

// Renderer class: draws a 2D image rotating in 3D space, filling the screen
export default class Renderer {
  constructor(container, imageUrl, x, y, z) {
    this.container = container;
    this.imageUrl = imageUrl;
    this.x = x;
    this.y = y;
    this.z = z;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.meshes = [];
    this.frameId = null;
    this.handleResize = this.handleResize.bind(this);
  }

  async init() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 2;
    this.camera.position.y = -2;
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0); // transparent

    // Add renderer to container
    if (this.container && this.renderer.domElement && !this.container.contains(this.renderer.domElement)) {
      this.container.appendChild(this.renderer.domElement);
    }

    // SpriteStack: split image into z slices of x by y
    const slices = await spritestack(this.imageUrl, this.x, this.y, this.z);

    // For each slice, create a plane and stack them
    const loader = new THREE.TextureLoader();
    for (let i = 0; i < slices.length; i++) {
      if (!this.scene) return; // Prevent error if scene is disposed
      const texture = await new Promise(resolve => loader.load(slices[i], resolve));
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = i * 0.05; // stack with small offset
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }

    this.animate(); // Start animation after all slices are loaded

    window.addEventListener('resize', this.handleResize);
  }

  handleResize() {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.init(); // animation starts after mesh is loaded
  }

  stop() {
    window.removeEventListener('resize', this.handleResize);
    cancelAnimationFrame(this.frameId);
    if (this.renderer && this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer?.dispose?.();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.meshes = [];
  }

  animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    // Rotate all stacked meshes together
    for (const mesh of this.meshes) {
      mesh.rotation.z += 0.01;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
