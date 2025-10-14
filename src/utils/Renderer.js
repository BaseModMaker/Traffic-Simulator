import * as THREE from 'three';
import WorldGrid from '../grid/WorldGrid';
import { TILES, BLOCKS, STICKERS, TOOLS } from '../data/Assets';
import Grass from '../gameobjects/tiles/Grass';

// Renderer class: loads and displays a GLB model
export default class Renderer {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.frameId = null;
    this.tiles = [];
    this.hoveredTile = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.buildTileName = Grass.name.toLowerCase(); // Default to grass tile
    this.textures = {};
    this.materials = {};
    this.cameraZoomSpeed = 0.1;
    this.cameraMoveSpeed = 2.0; // Increased from 0.2 to 2.0 for faster movement
    this.cameraRotateSpeed = 0.005;
    this.handleWheel = this.handleWheel.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    // Camera controls state
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };
    this.keysPressed = {};
    this.cameraSpherical = { radius: 5, phi: Math.PI / 4, theta: Math.PI / 4 };
    this.targetCameraSpherical = { radius: 5, phi: Math.PI / 4, theta: Math.PI / 4 }; // Target spherical coordinates
    this.rotationLerpSpeed = 0.1; // Lerp speed for smooth rotation

    // Additional state for build menu and tile highlighting
    this.openBuildMenuCallback = null;
    this.highlightLocked = false;
    this.lockedTile = null;

    // Grid interaction state
    this.gridInteractionEnabled = true;
    this.isPlacing = false; // Track if mouse is down for painting

    // Instance of WorldGrid
    this.worldGrid = null;

    // Initialize tools array
    this.tools = TOOLS;

    // Callback for move mode
    this.moveModeCallback = null;

    // Highlighted tiles state
    this.highlightedTiles = null;

    // Overlay for mouse hover
    this.hoverOverlay = null;
  }

  setOpenBuildMenu(cb) {
    this.openBuildMenuCallback = cb;
  }

  setHighlightLocked(locked) {
    this.highlightLocked = locked;
    if (!locked) {
      this.lockedTile = null;
      this.hoveredTile = null;
    }
  }

  setBuildTileName(name) {
    this.buildTileName = name;
  }

  setGridInteractionEnabled(enabled) {
    this.gridInteractionEnabled = enabled;
    if (!enabled) {
      this.hoveredTile = null;
    }
  }

  enableMoveMode(callback) {
    this.moveModeCallback = callback;
    // No tile highlighting, just enable the callback
  }

  clearHighlightedTiles() {
    if (this.highlightedTiles) {
      this.highlightedTiles.forEach(overlay => {
        this.scene.remove(overlay);
      });
      this.highlightedTiles = null;
    }
  }

  _createHighlightOverlay(tile, color) {
    const geometry = new THREE.PlaneGeometry(this.worldGrid.tileSize, this.worldGrid.tileSize);
    const material = new THREE.MeshBasicMaterial({
      color,
      opacity: 0.5,
      transparent: true,
      depthWrite: false, // Ensure it renders on top
    });
    const overlay = new THREE.Mesh(geometry, material);
    overlay.position.set(tile.position.x, tile.position.y + 0.01, tile.position.z); // Slightly above the tile
    overlay.rotation.x = -Math.PI / 2; // Align with the grid
    return overlay;
  }

  async init() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    // Initial spherical coordinates
    this.cameraSpherical.radius = 5;
    this.cameraSpherical.phi = Math.PI / 4;
    this.cameraSpherical.theta = Math.PI / 4;
    this.cameraTarget.set(0, 0, 0);
    this._updateCameraPosition();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    // Update tone mapping and color space
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Use ACESFilmicToneMapping for better color contrast
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // Use LinearSRGBColorSpace for vivid colors

    this.renderer.shadowMap.enabled = true; // Enable shadow maps
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows

    // Add renderer to container
    if (this.container && this.renderer.domElement && !this.container.contains(this.renderer.domElement)) {
      this.container.appendChild(this.renderer.domElement);
    }

    // Add lighting so the model is visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true; // Enable shadows for the light
    directionalLight.shadow.mapSize.width = 1024; // Shadow map resolution
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);

    // --- Initialize the grid ---
    const tileCount = 40;
    const tileSize = 1;
    const tiles = TILES;
    const blocks = BLOCKS;
    const stickers = STICKERS;

    // Ensure only objects with loadMaterials are passed
    const loadableItems = [...blocks, ...stickers].filter(item => typeof item.loadMaterials === 'function');
    await Promise.all(loadableItems.map(item => item.loadMaterials()));

    // Ensure stickers load their materials
    await Promise.all(stickers.map(sticker => sticker.loadMaterial()));

    this.stickers = stickers;
    this.tiles = tiles;
    this.blocks = blocks;

    // Ensure scene is initialized before creating WorldGrid
    if (!this.scene) {
      return;
    }

    this.worldGrid = new WorldGrid(this.scene, tileCount, tileSize, tiles);
    await this.worldGrid.initialize();
    // --- end grid ---

    // Start animation loop
    this.animate();

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('click', this.handleClick);
    window.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  handleClick(event) {
    if (!this.gridInteractionEnabled) return; // Prevent interaction if grid interaction is disabled
    if (!this.hoveredTile) return; // Ensure a tile is hovered over before proceeding

    const { x, z } = this.hoveredTile.userData;

    // Check if move mode is active
    if (this.moveModeCallback) {
      // Ignore clicks on out-of-range tiles
      const isInRange = this.worldGrid.isWithinMovementRange(x, z);
      if (!isInRange) return;

      // Ignore clicks on occupied tiles
      const isOccupied = this.hoveredTile.userData.sticker || this.hoveredTile.userData.block;
      if (isOccupied) return;

      this.moveModeCallback(this.hoveredTile); // Trigger the callback with the clicked tile
      this.moveModeCallback = null; // Reset move mode
      return;
    }

    // Check if the selected type is a sticker
    const selectedSticker = this.stickers.find(s => s.name === this.buildTileName);
    if (selectedSticker) {
      selectedSticker.createMesh(this.worldGrid.tileSize, x, z, this.worldGrid.gridSize).then(result => {
        if (!result) {
          console.error(`Failed to create mesh for sticker "${this.buildTileName}".`);
          return;
        }

        const { mesh } = result;
        this.scene.add(mesh);
        this.worldGrid.placeSticker(mesh, x, z);
      });
      return;
    }

    // Check if the selected type is a block
    const selectedBlock = this.blocks.find(b => b.name === this.buildTileName);
    if (selectedBlock) {
      this.worldGrid.placeBlock(selectedBlock, x, z);
      return;
    }

    // Check if the selected tool is "interact"
    const selectedTool = this.buildTileName === 'interact';
    if (selectedTool) {
      const tool = this.tools.find(t => t.name === 'interact');
      tool?.use(this.hoveredTile); // Call the use method of the Interact tool
      return;
    }

    // Delegate tile placement to WorldGrid
    this.worldGrid.placeTile(this.hoveredTile, this.buildTileName);
  }

  _placeTile(tile) {
    const name = this.buildTileName || 'grass';
    if (!name || name === 'interact') return;
    if (this.materials[name]) {
      tile.material = this.materials[name].clone();
      tile.userData.baseMaterial = this.materials[name].clone();
      tile.userData.highlightMaterial = this.materials[name + 'Highlight'].clone();
      tile.userData.name = name;
    }
  }

  _updateCameraPosition() {
    if (!this.camera) return; // Add null check for camera
    this.cameraSpherical.theta += (this.targetCameraSpherical.theta - this.cameraSpherical.theta) * this.rotationLerpSpeed;
    this.cameraSpherical.phi += (this.targetCameraSpherical.phi - this.cameraSpherical.phi) * this.rotationLerpSpeed;

    // Spherical to Cartesian
    const { radius, phi, theta } = this.cameraSpherical;
    this.camera.position.x = this.cameraTarget.x + radius * Math.sin(phi) * Math.sin(theta);
    this.camera.position.y = this.cameraTarget.y + radius * Math.cos(phi);
    this.camera.position.z = this.cameraTarget.z + radius * Math.sin(phi) * Math.cos(theta);
    this.camera.lookAt(this.cameraTarget);
  }

  handleMouseDown(event) {
    if (!this.gridInteractionEnabled) return; // Prevent interaction if disabled
    if (event.button === 2 || (event.button === 0 && event.altKey)) { // right-click or alt+left
      this.isDragging = true;
      this.lastMouse.x = event.clientX;
      this.lastMouse.y = event.clientY;
    }
    // Left mouse button for painting
    if (event.button === 0) {
      this.isPlacing = true;
      // Place tile immediately if hovering over one
      if (this.hoveredTile && this.buildTileName && this.buildTileName !== 'interact') {
        this._placeTile(this.hoveredTile);
      }
    }
  }

  handleMouseUp(event) {
    this.isDragging = false;
    if (event.button === 0) {
      this.isPlacing = false;
    }
  }

  handleMouseMove(event) {
    if (!this.gridInteractionEnabled) {
      if (this.hoverOverlay) {
        this.scene.remove(this.hoverOverlay);
        this.hoverOverlay = null;
      }
      return;
    }

    // Camera orbit
    if (this.isDragging) {
      const dx = event.clientX - this.lastMouse.x;
      const dy = event.clientY - this.lastMouse.y;
      this.lastMouse.x = event.clientX;
      this.lastMouse.y = event.clientY;

      this.cameraSpherical.theta -= dx * this.cameraRotateSpeed;
      this.cameraSpherical.phi -= dy * this.cameraRotateSpeed;
      // Clamp phi to avoid flipping
      this.cameraSpherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.cameraSpherical.phi));
      this._updateCameraPosition();
      return;
    }

    if (!this.camera || !this.renderer) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.worldGrid.getMeshes());

    if (this.hoverOverlay) {
      this.scene.remove(this.hoverOverlay); // Remove the previous hover overlay
      this.hoverOverlay = null;
    }

    if (intersects.length) {
      const tile = intersects[0].object;

      // Determine the hover overlay color
      let color = 0x00ff00; // Default green for in-range tiles
      if (this.moveModeCallback) {
        const { x, z } = tile.userData;
        const isInRange = this.worldGrid.isWithinMovementRange(x, z);
        const isOccupied = tile.userData.sticker || tile.userData.block;
        
        if (isOccupied) {
          color = 0xff0000; // Red for occupied tiles
        } else if (isInRange) {
          color = 0x0000ff; // Blue for valid in-range tiles
        } else {
          color = 0xff0000; // Red for out-of-range tiles
        }
      }

      // Create and add the hover overlay
      this.hoverOverlay = this._createHighlightOverlay(tile, color);
      this.scene.add(this.hoverOverlay);

      // Update the hovered tile reference
      this.hoveredTile = tile;
    } else {
      this.hoveredTile = null; // Clear the hovered tile if no intersection
    }
  }

  handleWheel(event) {
    if (!this.camera) return;
    event.preventDefault();
    // Zoom in/out by changing spherical radius, clamp to reasonable range
    const delta = event.deltaY * this.cameraZoomSpeed * 0.5;
    this.cameraSpherical.radius = Math.max(2, Math.min(100, this.cameraSpherical.radius + delta));
    this._updateCameraPosition();
  }

  handleKeyDown(event) {
    this.keysPressed[event.key.toLowerCase()] = true;
    // Rotate camera with A and E keys
    if (event.key.toLowerCase() === 'a' || event.key === 'shift') {
        this.targetCameraSpherical.theta -= this.cameraRotateSpeed * 10;
    }
    if (event.key.toLowerCase() === 'e' || event.key === '1') {
        this.targetCameraSpherical.theta += this.cameraRotateSpeed * 10;
    }
  }

  handleKeyUp(event) {
    this.keysPressed[event.key.toLowerCase()] = false;
  }

  _updateCameraTargetFromKeys() {
    if (!this.camera) return; // Add null check for camera
    // Pan camera target with arrow keys/WASD
    let dx = 0, dz = 0;
    // Use fractional movement for smoothness
    if (this.keysPressed['arrowup'] || this.keysPressed['z']) dz -= 1;
    if (this.keysPressed['arrowdown'] || this.keysPressed['s']) dz += 1;
    if (this.keysPressed['arrowleft'] || this.keysPressed['q']) dx -= 1;
    if (this.keysPressed['arrowright'] || this.keysPressed['d']) dx += 1;
    if (dx !== 0 || dz !== 0) {
      // Normalize direction for diagonal movement
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len > 0) {
        dx /= len;
        dz /= len;
      }
      // Move in camera's local XZ plane
      const moveSpeed = this.cameraMoveSpeed;
      const theta = this.cameraSpherical.theta;
      const forward = new THREE.Vector3(Math.sin(theta), 0, Math.cos(theta));
      const right = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
      // Use delta time for frame-rate independence
      const now = performance.now();
      if (!this._lastMoveTime) this._lastMoveTime = now;
      const dt = Math.min((now - this._lastMoveTime) / 1000, 0.05); // max 50ms step
      this._lastMoveTime = now;
      this.cameraTarget.add(forward.multiplyScalar(dz * moveSpeed * dt));
      this.cameraTarget.add(right.multiplyScalar(dx * moveSpeed * dt));
      this._updateCameraPosition();
    } else {
      this._lastMoveTime = undefined;
    }
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
    // Expose instance for React build menu updates
    if (this.container) this.container._rendererInstance = this;
    this.init();
  }

  stop() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('click', this.handleClick);
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    cancelAnimationFrame(this.frameId);
    if (this.renderer && this.renderer.domElement && this.container && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer?.dispose?.();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.tiles = [];
    this.hoveredTile = null;
    if (this.container) this.container._rendererInstance = null;
  }

  animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    // Smooth camera movement
    this._updateCameraTargetFromKeys();
    // Smooth camera movement
    this._updateCameraTargetFromKeys();
    this._updateCameraPosition(); // Ensure camera position updates every frame
    if (this.renderer && this.scene && this.camera) { // Ensure camera position updates every frame
        this.renderer.render(this.scene, this.camera);
    }
  }
}