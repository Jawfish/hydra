import './index.scss';

import App from '@/app';
import React from 'react';
import reactDom from 'react-dom/client';

const rootElement = document.querySelector('#root');
if (rootElement) {
  reactDom.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
