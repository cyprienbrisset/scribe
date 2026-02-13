import React from 'react';
import ReactDOM from 'react-dom/client';
import { SubtitlesOverlay } from './components/SubtitlesOverlay';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SubtitlesOverlay />
  </React.StrictMode>,
);
