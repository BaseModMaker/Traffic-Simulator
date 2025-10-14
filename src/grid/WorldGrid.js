import * as THREE from 'three';
import Grass from "../gameobjects/tiles/Grass";

export default class WorldGrid {
  constructor(scene, tileCount, tileSize, tiles) {
    this.scene = scene;
    this.tileCount = tileCount;
    this.tileSize = tileSize;
    this.gridSize = tileCount * tileSize;
    this.tiles = tiles;
    this.gridMeshes = [];
    this.blocks = new Map(); // Track blocks placed on the grid
    this.stickers = new Map(); // Track stickers placed on the grid
    this.debugConvexHull = null; // Store the convex hull for removal
    this.validMovementTiles = new Set(); // Store valid movement tile coordinates
  }

  async initialize() {
    // Load materials for all tiles
    await Promise.all(this.tiles.map(tile => tile.loadMaterials()));

    // Find the grass tile
    const grassTile = this.tiles.find(tile => tile.name === Grass.name.toLowerCase());
    if (!grassTile) {
      console.error('Grass tile not found in the tiles array.');
      return;
    }

    // Build the grid with grass tiles
    for (let x = 0; x < this.tileCount; x++) {
      for (let z = 0; z < this.tileCount; z++) {
        const mesh = grassTile.createMesh(this.tileSize, x, z, this.gridSize);
        this.scene.add(mesh);
        mesh.receiveShadow = true; // Enable receiving shadows for tiles
        this.gridMeshes.push(mesh);
      }
    }
  }

  placeTile(mesh, tileName) {
    const tile = this.tiles.find(t => t.name === tileName);
    if (!tile) return;

    // Remove any block on this tile
    const blockKey = `${mesh.userData.x},${mesh.userData.z}`;
    if (this.blocks.has(blockKey)) {
      const block = this.blocks.get(blockKey);
      this.scene.remove(block);
      this.blocks.delete(blockKey);
    }

    // Apply the tile material
    mesh.material = tile.material.clone();
    mesh.userData.baseMaterial = tile.material.clone();
    mesh.userData.name = tile.name;
  }

  placeBlock(block, x, z) {
    const blockKey = `${x},${z}`;
    if (this.blocks.has(blockKey)) return; // Prevent placing multiple blocks on the same tile

    const mesh = block.createMesh(this.tileSize, x, z, this.gridSize);
    this.scene.add(mesh);
    this.blocks.set(blockKey, mesh);

    // Update the tile's userData with the block reference
    const tile = this.gridMeshes.find(t => t.userData.x === x && t.userData.z === z);
    if (tile) {
      tile.userData.block = block;
    }
  }

  placeSticker(mesh, x, z) {
    const stickerKey = `${x},${z}`;
    if (this.stickers.has(stickerKey)) {
      const { mesh: existingMesh } = this.stickers.get(stickerKey);
      this.scene.remove(existingMesh);
      this.stickers.delete(stickerKey);
    }

    this.stickers.set(stickerKey, { mesh });

    // Update the tile's userData with the sticker reference
    const tile = this.gridMeshes.find(t => t.userData.x === x && t.userData.z === z);
    if (tile) {
      tile.userData.sticker = { name: mesh.userData.name };
    }
  }

  getMeshes() {
    return this.gridMeshes;
  }

  getTilesWithinRadius(centerX, centerZ, radius) {
    // Clear previous valid tiles
    this.validMovementTiles.clear();

    // Collect tiles within the Manhattan perimeter
    for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x++) {
      for (let z = Math.floor(centerZ - radius); z <= Math.ceil(centerZ + radius); z++) {
        const manhattanDistance = Math.abs(x - centerX) + Math.abs(z - centerZ);

        // Only include tiles within the Manhattan distance
        if (manhattanDistance <= radius) {
          this.validMovementTiles.add(`${x},${z}`);
        }
      }
    }

    // Draw the boundary line
    this._drawBoundary(centerX, centerZ, radius);

    return []; // Return empty array to prevent tile highlighting
  }

  isWithinMovementRange(x, z) {
    return this.validMovementTiles.has(`${x},${z}`);
  }

  clearMovementBoundary() {
    // Remove existing convex hull
    if (this.debugConvexHull) {
      this.scene.remove(this.debugConvexHull);
      this.debugConvexHull.geometry.dispose();
      this.debugConvexHull.material.dispose();
      this.debugConvexHull = null;
    }
    
    // Clear valid movement tiles
    this.validMovementTiles.clear();
  }

  _drawBoundary(centerX, centerZ, radius) {
    // Remove existing convex hull
    if (this.debugConvexHull) {
      this.scene.remove(this.debugConvexHull);
      this.debugConvexHull.geometry.dispose();
      this.debugConvexHull.material.dispose();
      this.debugConvexHull = null;
    }

    const tileSet = new Set();

    // Collect tiles within the Manhattan perimeter
    for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x++) {
      for (let z = Math.floor(centerZ - radius); z <= Math.ceil(centerZ + radius); z++) {
        const manhattanDistance = Math.abs(x - centerX) + Math.abs(z - centerZ);

        // Only include tiles within the Manhattan distance
        if (manhattanDistance <= radius) {
          tileSet.add(`${x},${z}`);
        }
      }
    }

    // Trace the rectilinear boundary
    const boundary = this._traceRectilinearBoundary(tileSet);
    
    // Draw the boundary
    if (boundary.length > 0) {
      const boundaryPoints = boundary.map(p => new THREE.Vector3(p.x, 0.01, p.z));
        
      const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
      const boundaryMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(0,0,1), linewidth: 2 });
      this.debugConvexHull = new THREE.Line(boundaryGeometry, boundaryMaterial);
      this.scene.add(this.debugConvexHull);
    }
  }

  _traceRectilinearBoundary(tileSet) {
    const edges = [];
    
    // Find all edges that are on the boundary (adjacent to non-included tiles)
    tileSet.forEach(tileKey => {
      const [x, z] = tileKey.split(',').map(Number);
      const tileWorldX = x * this.tileSize - this.gridSize / 2;
      const tileWorldZ = z * this.tileSize - this.gridSize / 2;
      
      // Check four edges of the tile
      const neighbors = [
        { key: `${x},${z-1}`, edge: [[tileWorldX, tileWorldZ], [tileWorldX + this.tileSize, tileWorldZ]] }, // Bottom
        { key: `${x+1},${z}`, edge: [[tileWorldX + this.tileSize, tileWorldZ], [tileWorldX + this.tileSize, tileWorldZ + this.tileSize]] }, // Right
        { key: `${x},${z+1}`, edge: [[tileWorldX + this.tileSize, tileWorldZ + this.tileSize], [tileWorldX, tileWorldZ + this.tileSize]] }, // Top
        { key: `${x-1},${z}`, edge: [[tileWorldX, tileWorldZ + this.tileSize], [tileWorldX, tileWorldZ]] } // Left
      ];
      
      neighbors.forEach(({ key, edge }) => {
        if (!tileSet.has(key)) {
          edges.push(edge);
        }
      });
    });
    
    // Convert edges to boundary points
    const boundaryPoints = [];
    if (edges.length > 0) {
      // Start with the first edge
      let currentEdge = edges[0];
      boundaryPoints.push({ x: currentEdge[0][0], z: currentEdge[0][1] });
      boundaryPoints.push({ x: currentEdge[1][0], z: currentEdge[1][1] });
      
      const usedEdges = new Set([0]);
      
      // Connect edges to form a continuous boundary
      while (usedEdges.size < edges.length) {
        const lastPoint = boundaryPoints[boundaryPoints.length - 1];
        
        let found = false;
        for (let i = 0; i < edges.length; i++) {
          if (usedEdges.has(i)) continue;
          
          const edge = edges[i];
          if (Math.abs(edge[0][0] - lastPoint.x) < 0.01 && Math.abs(edge[0][1] - lastPoint.z) < 0.01) {
            boundaryPoints.push({ x: edge[1][0], z: edge[1][1] });
            usedEdges.add(i);
            found = true;
            break;
          } else if (Math.abs(edge[1][0] - lastPoint.x) < 0.01 && Math.abs(edge[1][1] - lastPoint.z) < 0.01) {
            boundaryPoints.push({ x: edge[0][0], z: edge[0][1] });
            usedEdges.add(i);
            found = true;
            break;
          }
        }
        
        if (!found) break;
      }
      
      // Close the loop
      if (boundaryPoints.length > 0) {
        boundaryPoints.push({ x: boundaryPoints[0].x, z: boundaryPoints[0].z });
      }
    }
    
    return boundaryPoints;
  }
}
