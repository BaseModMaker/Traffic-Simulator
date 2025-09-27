import React, { useState, useEffect } from 'react';

const HOTBAR_SIZE = 10;

const Hotbar = ({ tiles, buildMenuOpen, setBuildMenuOpen, selectedTile, setSelectedTile }) => {
  const [hotbar] = useState([
    'interact', // 1
    'road',     // 2
    'grass',    // 3
    ...Array(HOTBAR_SIZE - 3).fill(null)
  ]);
  const [selectedHotbar, setSelectedHotbar] = useState(0);
  const [hotbarHovered, setHotbarHovered] = useState(false);

  // Hotbar slot click handler (selects slot)
  const handleHotbarClick = (idx) => {
    setSelectedHotbar(idx);
    setSelectedTile(hotbar[idx]); // Notify App of the selected tile type
  };

  useEffect(() => {
    // Disable grid interaction when hotbar is hovered
    if (hotbarHovered) {
      setBuildMenuOpen(false);
    }
  }, [hotbarHovered, setBuildMenuOpen]);

  return (
    <div
      className="hotbar-container"
      onMouseEnter={() => {
        setHotbarHovered(true);
        setBuildMenuOpen(false);
        if (window.rendererInstance) {
          window.rendererInstance.setGridInteractionEnabled(false); // Disable grid interaction
        }
      }}
      onMouseLeave={() => {
        setHotbarHovered(false);
        if (window.rendererInstance) {
          window.rendererInstance.setGridInteractionEnabled(true); // Re-enable grid interaction
        }
      }}
      onMouseDown={(e) => {
        e.stopPropagation(); // Prevent event propagation
      }}
    >
      {hotbar.map((type, idx) => {
        const tile = tiles.find(t => t.type === type);
        return (
          <div
            key={idx}
            className={`hotbar-slot${selectedHotbar === idx ? ' hotbar-slot-selected' : ''}`}
            onClick={() => handleHotbarClick(idx)}
          >
            {tile ? (
              <>
                <img src={tile.icon} alt={tile.name} className="hotbar-icon" />
                <div className="hotbar-slot-num">{idx === 9 ? 0 : idx + 1}</div>
              </>
            ) : (
              <div className="hotbar-slot-empty" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Hotbar;
