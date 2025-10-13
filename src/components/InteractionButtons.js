import React from 'react';
import '../styles/InteractionButtons.css';

const InteractionButtons = () => {
  return (
    <div className="interaction-buttons">
      {[1, 2, 3].map((i) => (
        <button key={`attack-${i}`} className="interaction-button attack-button">
          Attack {i}
        </button>
      ))}
      <button className="interaction-button move-button">Move</button>
    </div>
  );
};

export default InteractionButtons;
