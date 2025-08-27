import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Renderer class: loads and displays a GLB model
export default class Renderer {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.frameId = null;
    this.handleResize = this.handleResize.bind(this);
  }

  async init() {
    // Scene
    this.scene = new THREE.Scene();

    //model scale
    const modelScale = 20;

    // Camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 2;
    this.camera.position.y = 2;
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    // Add renderer to container
    if (this.container && this.renderer.domElement && !this.container.contains(this.renderer.domElement)) {
      this.container.appendChild(this.renderer.domElement);
    }

    // Add lighting so the model is visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7.5);
    this.scene.add(directionalLight);

    // Load GLB model
    const loader = new GLTFLoader();
    loader.load(
      process.env.PUBLIC_URL + '/cars/police.glb',
      (gltf) => {
        this.model = gltf.scene;
        // Scale up the model
        this.model.scale.set(modelScale, modelScale, modelScale);
        this.scene.add(this.model);
        this.animate();
      },
      undefined,
      (error) => {
        console.error('Error loading GLB model:', error);
      }
    );

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
    this.model = null;
  }

  animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    // Rotate the model
    if (this.model) {
      this.model.rotation.y += 0.01;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
