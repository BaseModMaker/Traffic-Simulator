import * as THREE from 'three';

export const animateSticker = (mesh, startPosition, endPosition, duration, easingFunction, trajectoryFunction, onComplete) => {
  let elapsedTime = 0;
  const clock = new THREE.Clock();

  const animate = () => {
    const delta = clock.getDelta();
    elapsedTime += delta;
    const t = Math.min(elapsedTime / duration, 1); // Normalized time (0 to 1)

    const easedT = easingFunction(t); // Apply easing function
    const trajectoryOffset = trajectoryFunction(t); // Apply trajectory function

    // Interpolate position
    mesh.position.lerpVectors(startPosition, endPosition, easedT);
    mesh.position.y += trajectoryOffset; // Add trajectory offset

    if (t < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };

  animate();
};
