import Tool from '../../components/Tool';
import ReactDOM from 'react-dom/client'; // Import createRoot
import InteractionButtons from '../../components/InteractionButtons';

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
            onMoveClick={() => {
              // Enable tile selection for movement
              window.rendererInstance?.enableMoveMode((selectedTile) => {
                console.log(`Tile clicked: (${selectedTile.userData.x}, ${selectedTile.userData.z})`);
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
