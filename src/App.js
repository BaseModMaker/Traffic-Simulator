import './App.css';
import Renderer from './Renderer';

import { useEffect, useRef } from 'react';

function App() {
  const rendererContainerRef = useRef(null);

  useEffect(() => {
    const renderer = new Renderer(
      rendererContainerRef.current,
      process.env.PUBLIC_URL + '/cars/cars-0.png',
      34, // x
      15, // y
      13  // z
    );
    renderer.start();
    return () => renderer.stop();
  }, []);

  return (
    <div className="App">
      <header className="App-header" style={{ padding: 0, margin: 0, width: '100vw', height: '100vh' }}>
        <div ref={rendererContainerRef} style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }} />
      </header>
    </div>
  );
}

export default App;
