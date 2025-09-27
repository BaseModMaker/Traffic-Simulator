import './App.css';
import Renderer from './Renderer';

import { useEffect, useRef, useState } from 'react';

const BLOCKS = [
  { type: 'interact', icon: process.env.PUBLIC_URL + '/tiles/interact.png', name: 'Interact Tool' },
  { type: 'road', icon: process.env.PUBLIC_URL + '/tiles/road.png', name: 'Road' },
  { type: 'grass', icon: process.env.PUBLIC_URL + '/tiles/grass.png', name: 'Grass' }
];

const BUILD_MENU_BLOCKS = BLOCKS.filter(b => b.type !== 'interact');

const HOTBAR_SIZE = 10; // 10 slots: 1-9, 0

function App() {
  const rendererContainerRef = useRef(null);
  // Hotbar: slot 1 = interact, 2 = road, 3 = grass, rest empty (null)
  const [hotbar, setHotbar] = useState([
    'interact', // 1
    'road',     // 2
    'grass',    // 3
    'garage',   // 4
    ...Array(HOTBAR_SIZE - 4).fill(null)
  ]);
  const [selectedHotbar, setSelectedHotbar] = useState(0);
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [highlightLocked, setHighlightLocked] = useState(false);
  const [gridInteractionEnabled, setGridInteractionEnabled] = useState(true);
  const [hotbarHovered, setHotbarHovered] = useState(false);

  // Set selectedTile to the currently selected hotbar slot
  const selectedTile = hotbar[selectedHotbar];

  // Open build menu with I, close with ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setBuildMenuOpen(false);
        setHighlightLocked(false);
      }
      if (e.key.toLowerCase() === 'i') {
        setBuildMenuOpen((open) => !open);
        setHighlightLocked(false);
      }
      // Hotbar selection: 1-9 and 0 keys (but do NOT change highlight)
      // (No-op: handled by click only)
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [buildMenuOpen]);

  // Disable grid interaction when build menu is open or hotbar is hovered
  useEffect(() => {
    setGridInteractionEnabled(!buildMenuOpen && !hotbarHovered);
  }, [buildMenuOpen, hotbarHovered]);

  // Update build type in renderer when selected hotbar slot changes
  useEffect(() => {
    if (rendererContainerRef.current && rendererContainerRef.current._rendererInstance) {
      rendererContainerRef.current._rendererInstance.setBuildTileType(selectedTile);
    }
  }, [selectedTile]);

  // When a block is selected in build menu, replace current hotbar slot (except slot 0)
  const handleBlockSelect = (type) => {
    setHotbar((prev) => {
      // Prevent replacing the interact tool in slot 0
      if (selectedHotbar === 0) return prev;
      const next = [...prev];
      next[selectedHotbar] = type;
      return next;
    });
    setBuildMenuOpen(false);
  };

  // Pass highlight lock state to renderer
  useEffect(() => {
    if (rendererContainerRef.current && rendererContainerRef.current._rendererInstance) {
      rendererContainerRef.current._rendererInstance.setHighlightLocked?.(highlightLocked);
    }
  }, [highlightLocked]);

  // Pass grid interaction enabled state to renderer
  useEffect(() => {
    if (rendererContainerRef.current && rendererContainerRef.current._rendererInstance) {
      rendererContainerRef.current._rendererInstance.setGridInteractionEnabled?.(gridInteractionEnabled);
    }
  }, [gridInteractionEnabled]);

  useEffect(() => {
    const renderer = new Renderer(rendererContainerRef.current);
    renderer.setBuildTileType?.(selectedTile);
    renderer.setOpenBuildMenu?.(() => {
      // No-op: build menu is now opened with I
    });
    renderer.setHighlightLocked?.(highlightLocked);
    renderer.setGridInteractionEnabled?.(gridInteractionEnabled);
    renderer.start();
    return () => renderer.stop();
    // eslint-disable-next-line
  }, []);

  // Hotbar slot click handler (selects slot)
  const handleHotbarClick = (idx) => {
    setSelectedHotbar(idx);
    // No need to setGridInteractionEnabled here, handled by hover logic
  };

  return (
    <div className="App">
      <header className="App-header" style={{ padding: 0, margin: 0, width: '100vw', height: '100vh' }}>
        {buildMenuOpen && (
          <div className="build-menu-center">
            <div style={{ marginBottom: 16, color: '#fff', fontWeight: 'bold', fontSize: 22 }}>Build Menu</div>
            <div style={{ display: 'flex', gap: 32 }}>
              {BUILD_MENU_BLOCKS.map(block => (
                <div key={block.type} style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => handleBlockSelect(block.type)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      borderRadius: 8,
                      padding: 4,
                      cursor: 'pointer'
                    }}
                    title={block.name}
                  >
                    <img src={block.icon} alt={block.name} style={{ width: 64, height: 64, display: 'block' }} />
                  </button>
                  <div style={{ color: '#fff', marginTop: 6 }}>{block.name}</div>
                </div>
              ))}
            </div>
            <div style={{ color: '#aaa', fontSize: 14, marginTop: 18 }}>
              ESC to close • Click to assign to slot {selectedHotbar === 9 ? 0 : selectedHotbar + 1}
              {selectedHotbar === 0 && <span style={{ color: '#f77', marginLeft: 8 }}>(Interact tool can't be replaced)</span>}
            </div>
          </div>
        )}
        <div ref={rendererContainerRef} style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }} />
        {/* Hotbar UI */}
        <div
          className="hotbar-container"
          onMouseEnter={() => setHotbarHovered(true)}
          onMouseLeave={() => setHotbarHovered(false)}
        >
          {hotbar.map((type, idx) => {
            const block = BLOCKS.find(b => b.type === type);
            return (
              <div
                key={idx}
                className={`hotbar-slot${selectedHotbar === idx ? ' hotbar-slot-selected' : ''}`}
                onClick={() => handleHotbarClick(idx)}
              >
                {block ? (
                  <>
                    <img src={block.icon} alt={block.name} className="hotbar-icon" />
                    <div className="hotbar-slot-num">{idx === 9 ? 0 : idx + 1}</div>
                  </>
                ) : (
                  <div className="hotbar-slot-empty" />
                )}
              </div>
            );
          })}
        </div>
      </header>
    </div>
  );
}

export default App;
