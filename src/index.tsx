import './global.scss';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import reportWebVitals from './reportWebVitals';
import SessionProvider from './components/SessionProvider';
import VisualViewportProvider from './components/VisualViewport';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <SessionProvider>
            <App />
        </SessionProvider>
        <VisualViewportProvider />
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

console.log(import.meta.env.VITE_SERVER_URI);
