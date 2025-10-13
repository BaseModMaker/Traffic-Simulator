import Tool from '../../components/Tool';
import ReactDOM from 'react-dom/client';
import InteractionButtons from '../../components/InteractionButtons';
import * as THREE from 'three';
import { moveSticker } from '../../utils/StickerMovement';

export default class Interact extends Tool {
  constructor() {
    super('interact');
  }

  use(tile) {
    const buttonContainerId = 'interaction-buttons-container';

    // Remove existing buttons if they exist
    let buttonContainer = document.getElementById(buttonContainerId);
    if (buttonContainer) {
      ReactDOM.createRoot(buttonContainer).unmount(); // Unmount the React component
      buttonContainer.remove();
      window.rendererInstance?.setGridInteractionEnabled(true); // Re-enable grid interaction
    }

    if (tile) {
      const { sticker } = tile.userData;
      if (sticker) {
        // Create a container for the React component
        buttonContainer = document.createElement('div');
        buttonContainer.id = buttonContainerId;
        document.body.appendChild(buttonContainer);

        // Disable grid interaction
        window.rendererInstance?.setGridInteractionEnabled(false);

        // Render the InteractionButtons component
        const root = ReactDOM.createRoot(buttonContainer);
        root.render(
          <InteractionButtons
            sticker={sticker} // Pass sticker data
            onMoveClick={(sticker) => {
              // Enable tile selection for movement
              window.rendererInstance?.enableMoveMode((selectedTile) => {
                const { x, z } = selectedTile.userData;

                // Move the sticker to the new tile with animation
                const stickerKey = `${x},${z}`;
                const oldStickerKey = `${tile.userData.x},${tile.userData.z}`;
                const mesh = window.rendererInstance.worldGrid.stickers.get(oldStickerKey)?.mesh;

                if (mesh) {
                  const startPosition = mesh.position.clone();
                  const endPosition = new THREE.Vector3(
                    x * window.rendererInstance.worldGrid.tileSize - window.rendererInstance.worldGrid.gridSize / 2 + window.rendererInstance.worldGrid.tileSize / 2,
                    mesh.position.y,
                    z * window.rendererInstance.worldGrid.tileSize - window.rendererInstance.worldGrid.gridSize / 2 + window.rendererInstance.worldGrid.tileSize / 2
                  );

                  moveSticker(mesh, startPosition, endPosition, 1, () => {
                    window.rendererInstance.worldGrid.stickers.delete(oldStickerKey);
                    window.rendererInstance.worldGrid.stickers.set(stickerKey, { mesh });
                    selectedTile.userData.sticker = { name: sticker.name };
                    tile.userData.sticker = null;
                  });
                }

                root.unmount(); // Unmount the React component
                buttonContainer.remove(); // Remove the button container
                window.rendererInstance?.setGridInteractionEnabled(true); // Re-enable grid interaction
              });
            }}
          />
        );
      }
    }
  }
}
