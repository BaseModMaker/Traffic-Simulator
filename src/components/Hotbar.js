import React, { useState, useEffect } from 'react';
import Interact from '../gameobjects/tools/Interact';
import Road from '../gameobjects/tiles/Road';
import Grass from '../gameobjects/tiles/Grass';
import Ammo from '../gameobjects/blocks/Ammo';
import Saloon from '../gameobjects/blocks/Saloon';
import Engineer from '../gameobjects/stickers/Engineer';
import Sniper from '../gameobjects/stickers/Sniper';
import Shellback_Sentinel from '../gameobjects/stickers/ShellbackSentinel';
import Clankette_The_Patchsmith from '../gameobjects/stickers/ClanketteThePatchsmith';

const HOTBAR_SIZE = 10;

const Hotbar = ({ tiles, buildMenuOpen, setBuildMenuOpen, selectedTile, setSelectedTile }) => {
  const [hotbar] = useState([
    Interact.name.toLowerCase(), // 1
    Road.name.toLowerCase(),     // 2
    Grass.name.toLowerCase(),    // 3
    Ammo.name.toLowerCase(),     // 4
    Saloon.name.toLowerCase(),   // 5
    Engineer.name.toLowerCase(), // 6
    Sniper.name.toLowerCase(),   // 7
    Shellback_Sentinel.name.toLowerCase(), // 8
    Clankette_The_Patchsmith.name.toLowerCase(), // 9
    ...Array(HOTBAR_SIZE - 9).fill(null)
  ]);
  const [selectedHotbar, setSelectedHotbar] = useState(0);
  const [hotbarHovered, setHotbarHovered] = useState(false);

  // Hotbar slot click handler (selects slot)
  const handleHotbarClick = (idx) => {
    setSelectedHotbar(idx);
    const selectedItem = hotbar[idx];
    setSelectedTile(selectedItem); // Notify App of the selected tile/block type
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
      {hotbar.map((name, idx) => {
        const item = tiles.find(t => t.name === name); // Find both tiles and blocks
        return (
          <div
            key={idx}
            className={`hotbar-slot${selectedHotbar === idx ? ' hotbar-slot-selected' : ''}`}
            onClick={() => handleHotbarClick(idx)}
          >
            {item ? (
              <>
                <img src={item.image} alt={item.name} className="hotbar-icon" />
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
