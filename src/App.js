import './App.css';
import Renderer from './Renderer';

import { useEffect, useRef, useState } from 'react';

const BLOCKS = [
  { type: 'grass', icon: process.env.PUBLIC_URL + '/blocks/grass.png', name: 'Grass' },
  { type: 'road', icon: process.env.PUBLIC_URL + '/blocks/road.png', name: 'Road' }
];

function App() {
  const rendererContainerRef = useRef(null);
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [selectedTile, setSelectedTile] = useState('grass');
  const [highlightLocked, setHighlightLocked] = useState(false);

  // Open build menu when a tile is clicked
  useEffect(() => {
    if (!rendererContainerRef.current) return;
    const renderer = rendererContainerRef.current._rendererInstance;
    if (!renderer) return;
    renderer.setOpenBuildMenu?.(() => {
      setBuildMenuOpen(true);
      setHighlightLocked(true);
    });
    renderer.setHighlightLocked?.(highlightLocked);
  }, [highlightLocked]);

  // ESC closes build menu and unlocks highlight
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setBuildMenuOpen(false);
        setHighlightLocked(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  // Update build type on change
  useEffect(() => {
    if (rendererContainerRef.current && rendererContainerRef.current._rendererInstance) {
      rendererContainerRef.current._rendererInstance.setBuildTileType(selectedTile);
    }
  }, [selectedTile]);

  // When a block is selected, close build menu and unlock highlight, and place the tile
  const handleBlockSelect = (type) => {
    setSelectedTile(type);
    setBuildMenuOpen(false);
    setHighlightLocked(false);
    // Place the selected tile type at the locked tile
    if (
      rendererContainerRef.current &&
      rendererContainerRef.current._rendererInstance &&
      rendererContainerRef.current._rendererInstance.lockedTile
    ) {
      rendererContainerRef.current._rendererInstance.setBuildTileType(type);
    }
  };

  useEffect(() => {
    // Pass highlight lock state to renderer
    if (rendererContainerRef.current && rendererContainerRef.current._rendererInstance) {
      rendererContainerRef.current._rendererInstance.setHighlightLocked?.(highlightLocked);
    }
  }, [highlightLocked]);

  useEffect(() => {
    const renderer = new Renderer(rendererContainerRef.current);
    renderer.setBuildTileType?.(selectedTile);
    renderer.setOpenBuildMenu?.(() => {
      setBuildMenuOpen(true);
      setHighlightLocked(true);
    });
    renderer.setHighlightLocked?.(highlightLocked);
    renderer.start();
    return () => renderer.stop();
  }, []);

  return (
    <div className="App">
      <header className="App-header" style={{ padding: 0, margin: 0, width: '100vw', height: '100vh' }}>
        {buildMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '50%',
            right: 30,
            transform: 'translateY(-50%)',
            zIndex: 20,
            background: 'rgba(40,44,52,0.95)',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 16px #0008',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ marginBottom: 12, color: '#fff', fontWeight: 'bold' }}>Select Block</div>
            {BLOCKS.map(block => (
              <div key={block.type} style={{ marginBottom: 12, position: 'relative' }}>
                <button
                  onClick={() => handleBlockSelect(block.type)}
                  style={{
                    border: 'none',
                    background: selectedTile === block.type ? '#444' : 'transparent',
                    borderRadius: 8,
                    padding: 4,
                    cursor: 'pointer'
                  }}
                  title={block.name}
                >
                  <img src={block.icon} alt={block.name} style={{ width: 48, height: 48, display: 'block' }} />
                </button>
                <div className="block-tooltip">{block.name}</div>
              </div>
            ))}
            <div style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>ESC to cancel</div>
          </div>
        )}
        <div ref={rendererContainerRef} style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }} />
      </header>
    </div>
  );
}

export default App;
