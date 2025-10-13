import * as THREE from 'three';

export const moveSticker = (mesh, startPosition, endPosition, duration, onComplete) => {
  const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // EaseInOut function
  const bellCurve = (t) => Math.sin(Math.PI * t) * 0.5; // Bell curve for vertical trajectory

  let elapsedTime = 0;
  const clock = new THREE.Clock();

  const animate = () => {
    const delta = clock.getDelta();
    elapsedTime += delta;
    const t = Math.min(elapsedTime / duration, 1); // Normalized time (0 to 1)

    const easedT = easeInOut(t); // Apply easeInOut curve
    const bellOffset = bellCurve(t); // Apply bell curve for vertical offset

    // Interpolate position
    mesh.position.lerpVectors(startPosition, endPosition, easedT);
    mesh.position.y += bellOffset; // Add vertical offset

    if (t < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };

  animate();
};
