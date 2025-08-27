import './App.css';
import Renderer from './Renderer';

import { useEffect, useRef, useState } from 'react';

function App() {
  const rendererContainerRef = useRef(null);
  const [selectedTile, setSelectedTile] = useState('grass');

  useEffect(() => {
    const renderer = new Renderer(
      rendererContainerRef.current
    );
    renderer.setBuildTileType?.(selectedTile); // set initial type if supported
    renderer.start();

    // Listen for tile type changes
    renderer.setBuildTileType && renderer.setBuildTileType(selectedTile);

    return () => renderer.stop();
  }, []);

  // Update build type on change
  useEffect(() => {
    if (rendererContainerRef.current && rendererContainerRef.current._rendererInstance) {
      rendererContainerRef.current._rendererInstance.setBuildTileType(selectedTile);
    }
  }, [selectedTile]);

  return (
    <div className="App">
      <header className="App-header" style={{ padding: 0, margin: 0, width: '100vw', height: '100vh' }}>
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(40,44,52,0.9)', borderRadius: 8, padding: 8
        }}>
          <span style={{ marginRight: 8 }}>Build:</span>
          <button
            onClick={() => setSelectedTile('grass')}
            style={{ fontWeight: selectedTile === 'grass' ? 'bold' : 'normal', marginRight: 4 }}
          >Grass</button>
          <button
            onClick={() => setSelectedTile('road')}
            style={{ fontWeight: selectedTile === 'road' ? 'bold' : 'normal' }}
          >Road</button>
        </div>
        <div ref={rendererContainerRef} style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }} />
      </header>
    </div>
  );
}

export default App;
