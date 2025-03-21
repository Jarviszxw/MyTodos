import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

// Create root node
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 