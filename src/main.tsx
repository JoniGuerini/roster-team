import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@tabler/icons-webfont/dist/tabler-icons.min.css';
import './index.css';

if (import.meta.env.DEV) {
  void import('./dev/seedFuncionarios').then((mod) => {
    (
      window as unknown as {
        __BRISA_SEED__?: typeof mod;
      }
    ).__BRISA_SEED__ = mod;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
