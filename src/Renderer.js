import * as THREE from 'three';

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
    this.buildTileType = 'grass';
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

    // Additional state for build menu and tile highlighting
    this.openBuildMenuCallback = null;
    this.highlightLocked = false;
    this.lockedTile = null;

    // Grid interaction state
    this.gridInteractionEnabled = true;
    this.isPlacing = false; // Track if mouse is down for painting
  }

  setOpenBuildMenu(cb) {
    this.openBuildMenuCallback = cb;
  }

  setHighlightLocked(locked) {
    this.highlightLocked = locked;
    if (!locked) {
      this.lockedTile = null;
      if (this.hoveredTile) {
        this.hoveredTile.material = this.hoveredTile.userData.baseMaterial;
        this.hoveredTile = null;
      }
    }
  }

  setBuildTileType(type) {
    this.buildTileType = type;
  }

  setGridInteractionEnabled(enabled) {
    this.gridInteractionEnabled = enabled;
    // Remove highlight if disabling interaction
    if (!enabled && this.hoveredTile) {
      this.hoveredTile.material = this.hoveredTile.userData.baseMaterial;
      this.hoveredTile = null;
    }
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

    // --- Add grass and road textures/materials ---
    const tileCount = 40;
    const tileSize = 1;
    const gridSize = tileCount * tileSize;

    const loaderTex = new THREE.TextureLoader();
    // Load both textures up front
    loaderTex.load(
      process.env.PUBLIC_URL + '/tiles/grass.png',
      (grassTexture) => {
        if (!this.scene) return;
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(1, 1);
        grassTexture.minFilter = THREE.LinearMipMapLinearFilter;
        grassTexture.magFilter = THREE.NearestFilter;
        this.textures.grass = grassTexture;
        this.materials.grass = new THREE.MeshLambertMaterial({ map: grassTexture });
        this.materials.grassHighlight = new THREE.MeshLambertMaterial({
          map: grassTexture,
          side: THREE.DoubleSide,
          emissive: 0x00ff00,
          emissiveIntensity: 0.5,
        });

        // Only build grid after both textures loaded
        if (this.textures.road !== undefined) this._buildGrid(tileCount, tileSize, gridSize);
      }
    );
    loaderTex.load(
      process.env.PUBLIC_URL + '/tiles/road.png',
      (roadTexture) => {
        if (!this.scene) return;
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(1, 1);
        roadTexture.minFilter = THREE.LinearMipMapLinearFilter;
        roadTexture.magFilter = THREE.NearestFilter;
        this.textures.road = roadTexture;
        this.materials.road = new THREE.MeshLambertMaterial({ map: roadTexture });
        this.materials.roadHighlight = new THREE.MeshLambertMaterial({
          map: roadTexture,
          side: THREE.DoubleSide,
          emissive: 0x00ff00,
          emissiveIntensity: 0.5,
        });

        // Only build grid after both textures loaded
        if (this.textures.grass !== undefined) this._buildGrid(tileCount, tileSize, gridSize);
      }
    );
    // --- end grass/road grid ---

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

  _buildGrid(tileCount, tileSize, gridSize) {
    // Remove previous tiles if any
    this.tiles = [];
    // Remove old meshes from scene
    if (this.scene) {
      for (let i = this.scene.children.length - 1; i >= 0; i--) {
        const obj = this.scene.children[i];
        if (obj.userData && obj.userData.isTile) {
          this.scene.remove(obj);
        }
      }
    }
    for (let x = 0; x < tileCount; x++) {
      for (let z = 0; z < tileCount; z++) {
        const geo = new THREE.PlaneGeometry(tileSize, tileSize);
        const mesh = new THREE.Mesh(geo, this.materials.grass.clone());
        mesh.position.x = x * tileSize - gridSize / 2 + tileSize / 2;
        mesh.position.z = z * tileSize - gridSize / 2 + tileSize / 2;
        mesh.rotation.x = -Math.PI / 2;
        mesh.userData = {
          baseMaterial: mesh.material,
          highlightMaterial: this.materials.grassHighlight.clone(),
          type: 'grass',
          isTile: true,
          x, z
        };
        this.scene.add(mesh);
        this.tiles.push(mesh);
      }
    }
  }

  handleClick(event) {
    if (!this.gridInteractionEnabled) return;
    // Place the selected tile type on the clicked tile
    if (!this.hoveredTile) return;
    if (!this.buildTileType || this.buildTileType === 'interact') return;
    this._placeTile(this.hoveredTile);
  }

  _placeTile(tile) {
    const type = this.buildTileType || 'grass';
    if (!type || type === 'interact') return;
    if (this.materials[type]) {
      tile.material = this.materials[type].clone();
      tile.userData.baseMaterial = this.materials[type].clone();
      tile.userData.highlightMaterial = this.materials[type + 'Highlight'].clone();
      tile.userData.type = type;
    }
  }

  _updateCameraPosition() {
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
      if (this.hoveredTile && this.buildTileType && this.buildTileType !== 'interact') {
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
      if (this.hoveredTile) {
        this.hoveredTile.material = this.hoveredTile.userData.baseMaterial;
        this.hoveredTile = null;
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

    // If highlight is locked, only keep the locked tile highlighted
    if (this.highlightLocked) {
      if (this.lockedTile && this.hoveredTile !== this.lockedTile) {
        if (this.hoveredTile) {
          this.hoveredTile.material = this.hoveredTile.userData.baseMaterial;
        }
        this.hoveredTile = this.lockedTile;
        this.hoveredTile.material = this.hoveredTile.userData.highlightMaterial;
      }
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.tiles);

    if (this.hoveredTile && (!intersects.length || intersects[0].object !== this.hoveredTile)) {
      // Restore previous tile
      this.hoveredTile.material = this.hoveredTile.userData.baseMaterial;
      this.hoveredTile = null;
    }
    if (intersects.length) {
      const tile = intersects[0].object;
      if (this.hoveredTile !== tile) {
        if (this.hoveredTile) {
          this.hoveredTile.material = this.hoveredTile.userData.baseMaterial;
        }
        tile.material = tile.userData.highlightMaterial;
        this.hoveredTile = tile;
      }
      // Paint while mouse is down
      if (this.isPlacing && this.buildTileType && this.buildTileType !== 'interact') {
        this._placeTile(tile);
      }
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
  }

  handleKeyUp(event) {
    this.keysPressed[event.key.toLowerCase()] = false;
  }

  _updateCameraTargetFromKeys() {
    // Pan camera target with arrow keys/WASD
    let dx = 0, dz = 0;
    // Use fractional movement for smoothness
    if (this.keysPressed['arrowup'] || this.keysPressed['w']) dz -= 1;
    if (this.keysPressed['arrowdown'] || this.keysPressed['s']) dz += 1;
    if (this.keysPressed['arrowleft'] || this.keysPressed['a']) dx -= 1;
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
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
