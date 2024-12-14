import './index.scss';

import App from '@/app';
import React from 'react';
import reactDom from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.querySelector('#root');
if (rootElement) {
  reactDom.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
