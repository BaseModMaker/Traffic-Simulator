import * as THREE from 'three';

// Renderer class: draws a 2D image rotating in 3D space, filling the screen
export default class Renderer {
  constructor(container, imageUrl) {
    this.container = container;
    this.imageUrl = imageUrl;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.frameId = null;
    this.handleResize = this.handleResize.bind(this);
  }

  init() {
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
    this.container.appendChild(this.renderer.domElement);

    // Texture and Mesh
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(this.imageUrl, (texture) => {
      if (!this.scene) return; // Prevent error if scene is disposed
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);
      this.animate(); // Start animation only after mesh is loaded
    });

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
    this.init();
    // animation now starts after mesh is loaded
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
    this.mesh = null;
  }

  animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    if (this.mesh) {
      this.mesh.rotation.z += 0.01;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
