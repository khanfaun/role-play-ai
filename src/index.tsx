import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/base.css';
import './styles/main-menu.css';
import './styles/setup.css';
import './styles/game-layout.css';
import './styles/story-and-panels.css';
import './styles/modal-views.css';
import './styles/item-components.css';
import './styles/responsive.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Không tìm thấy phần tử root để gắn ứng dụng");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
