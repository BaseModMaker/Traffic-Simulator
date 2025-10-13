import React from 'react';
import '../styles/InteractionButtons.css';

const InteractionButtons = ({ onMoveClick }) => {
  const handleMouseEnter = () => {
    window.rendererInstance?.setGridInteractionEnabled(false); // Disable grid interaction
  };

  const handleMouseLeave = () => {
    window.rendererInstance?.setGridInteractionEnabled(true); // Re-enable grid interaction
  };

  return (
    <div
      className="interaction-buttons"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3].map((i) => (
        <button key={`attack-${i}`} className="interaction-button attack-button">
          Attack {i}
        </button>
      ))}
      <button className="interaction-button move-button" onClick={onMoveClick}>
        Move
      </button>
    </div>
  );
};

export default InteractionButtons;
