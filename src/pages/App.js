import '../styles/App.css';
import Renderer from '../utils/Renderer';
import Hotbar from '../components/Hotbar';

import { useEffect, useRef, useState } from 'react';

import { TOOLS, TILES, BLOCKS, STICKERS } from '../data/Assets';

const BUILD_MENU_TILES = [...TILES, ...BLOCKS, ...STICKERS];

function App() {
  const rendererContainerRef = useRef(null);
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [highlightLocked, setHighlightLocked] = useState(false);
  const [gridInteractionEnabled, setGridInteractionEnabled] = useState(true);
  const [selectedTile, setSelectedTile] = useState('interact'); // Track the selected tile type

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
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [buildMenuOpen]);

  // Disable grid interaction when build menu is open
  useEffect(() => {
    setGridInteractionEnabled(!buildMenuOpen);
  }, [buildMenuOpen]);

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

  // Pass selected tile type to renderer
  useEffect(() => {
    if (rendererContainerRef.current && rendererContainerRef.current._rendererInstance) {
      rendererContainerRef.current._rendererInstance.setBuildTileName(selectedTile);
    }
  }, [selectedTile]);

  useEffect(() => {
    const renderer = new Renderer(rendererContainerRef.current);
    renderer.start();
    window.rendererInstance = renderer; // Expose renderer instance globally
    return () => {
      renderer.stop();
      window.rendererInstance = null; // Clean up global reference
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="App">
      <header className="App-header" style={{ padding: 0, margin: 0, width: '100vw', height: '100vh' }}>
        {buildMenuOpen && (
          <div className="build-menu-center">
            <div style={{ marginBottom: 16, color: '#fff', fontWeight: 'bold', fontSize: 22 }}>Build Menu</div>
            <div style={{ display: 'flex', gap: 32 }}>
              {BUILD_MENU_TILES.map(tile => (
                <div key={tile.name} style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => {}}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      borderRadius: 8,
                      padding: 4,
                      cursor: 'pointer'
                    }}
                    title={tile.name}
                  >
                    <img src={tile.icon} alt={tile.name} style={{ width: 64, height: 64, display: 'block' }} />
                  </button>
                  <div style={{ color: '#fff', marginTop: 6 }}>{tile.name}</div>
                </div>
              ))}
            </div>
            <div style={{ color: '#aaa', fontSize: 14, marginTop: 18 }}>
              ESC to close
            </div>
          </div>
        )}
        <div ref={rendererContainerRef} style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }} />
        {/* Hotbar UI */}
        <Hotbar
          tiles={[...TOOLS, ...TILES, ...BLOCKS, ...STICKERS]}
          buildMenuOpen={buildMenuOpen}
          setBuildMenuOpen={setBuildMenuOpen}
          selectedTile={selectedTile}
          setSelectedTile={setSelectedTile} // Pass selectedTile state to Hotbar
        />
      </header>
    </div>
  );
}

export default App;