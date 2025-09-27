import './App.css';
import Renderer from './Renderer';
import Hotbar from './Hotbar';

import { useEffect, useRef, useState } from 'react';

const BLOCKS = [
  { type: 'interact', icon: process.env.PUBLIC_URL + '/tiles/interact.png', name: 'Interact Tool' },
  { type: 'road', icon: process.env.PUBLIC_URL + '/tiles/road.png', name: 'Road' },
  { type: 'grass', icon: process.env.PUBLIC_URL + '/tiles/grass.png', name: 'Grass' }
];

const BUILD_MENU_BLOCKS = BLOCKS.filter(b => b.type !== 'interact');

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
      rendererContainerRef.current._rendererInstance.setBuildTileType(selectedTile);
    }
  }, [selectedTile]);

  useEffect(() => {
    const renderer = new Renderer(rendererContainerRef.current);
    renderer.start();
    return () => renderer.stop();
    // eslint-disable-next-line
  }, []);

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
                    onClick={() => {}}
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
              ESC to close
            </div>
          </div>
        )}
        <div ref={rendererContainerRef} style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }} />
        {/* Hotbar UI */}
        <Hotbar
          blocks={BLOCKS}
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