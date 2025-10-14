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

    // BFS to find reachable tiles
    const queue = [{ x: centerX, z: centerZ, distance: 0 }];
    const visited = new Set();
    visited.add(`${centerX},${centerZ}`);

    while (queue.length > 0) {
      const { x, z, distance } = queue.shift();

      // Add the current tile to valid movement tiles
      this.validMovementTiles.add(`${x},${z}`);

      // Stop if the distance exceeds the radius
      if (distance >= radius) continue;

      // Check neighbors (up, down, left, right)
      const neighbors = [
        { x: x, z: z - 1 },
        { x: x, z: z + 1 },
        { x: x - 1, z: z },
        { x: x + 1, z: z },
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.z}`;
        if (!visited.has(key)) {
          const tile = this.gridMeshes.find(t => t.userData.x === neighbor.x && t.userData.z === neighbor.z);

          // Only add the neighbor if it's not blocked
          if (tile && !tile.userData.block) {
            queue.push({ ...neighbor, distance: distance + 1 });
            visited.add(key);
          }
        }
      }
    }

    // Draw the boundary line
    this._drawBoundary();

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

  _drawBoundary() {
    // Remove existing convex hull
    if (this.debugConvexHull) {
      this.scene.remove(this.debugConvexHull);
      this.debugConvexHull.geometry.dispose();
      this.debugConvexHull.material.dispose();
      this.debugConvexHull = null;
    }

    const tileSet = new Set(this.validMovementTiles);

    // Trace the rectilinear boundary
    const boundary = this._traceRectilinearBoundary(tileSet);

    // Draw the boundary
    if (boundary.length > 0) {
      const boundaryPoints = boundary.map(p => new THREE.Vector3(
        p.x * this.tileSize - this.gridSize / 2,
        0.01, // Slightly above the grid
        p.z * this.tileSize - this.gridSize / 2
      ));

      // Close the loop by adding the first point at the end
      boundaryPoints.push(boundaryPoints[0]);

      const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
      const boundaryMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(0, 0, 1), linewidth: 2 });
      this.debugConvexHull = new THREE.Line(boundaryGeometry, boundaryMaterial);
      this.scene.add(this.debugConvexHull);
    }
  }

  _traceRectilinearBoundary(tileSet) {
    const edges = [];

    // Find all edges that are on the boundary (adjacent to non-included tiles)
    tileSet.forEach(tileKey => {
      const [x, z] = tileKey.split(',').map(Number);

      // Check four edges of the tile
      const neighbors = [
        { key: `${x},${z - 1}`, edge: { x1: x, z1: z, x2: x + 1, z2: z } }, // Bottom
        { key: `${x + 1},${z}`, edge: { x1: x + 1, z1: z, x2: x + 1, z2: z + 1 } }, // Right
        { key: `${x},${z + 1}`, edge: { x1: x + 1, z1: z + 1, x2: x, z2: z + 1 } }, // Top
        { key: `${x - 1},${z}`, edge: { x1: x, z1: z + 1, x2: x, z2: z } } // Left
      ];

      neighbors.forEach(({ key, edge }) => {
        if (!tileSet.has(key)) {
          edges.push(edge);
        }
      });
    });

    // Sort edges into a continuous boundary
    const boundary = [];
    if (edges.length > 0) {
      let currentEdge = edges.pop();
      boundary.push({ x: currentEdge.x1, z: currentEdge.z1 });
      boundary.push({ x: currentEdge.x2, z: currentEdge.z2 });

      while (edges.length > 0) {
        const lastPoint = boundary[boundary.length - 1];
        const nextEdgeIndex = edges.findIndex(edge =>
          (Math.abs(edge.x1 - lastPoint.x) < 0.01 && Math.abs(edge.z1 - lastPoint.z) < 0.01) ||
          (Math.abs(edge.x2 - lastPoint.x) < 0.01 && Math.abs(edge.z2 - lastPoint.z) < 0.01)
        );

        if (nextEdgeIndex === -1) break;

        const nextEdge = edges.splice(nextEdgeIndex, 1)[0];
        if (Math.abs(nextEdge.x1 - lastPoint.x) < 0.01 && Math.abs(nextEdge.z1 - lastPoint.z) < 0.01) {
          boundary.push({ x: nextEdge.x2, z: nextEdge.z2 });
        } else {
          boundary.push({ x: nextEdge.x1, z: nextEdge.z1 });
        }
      }
    }

    return boundary;
  }
}
