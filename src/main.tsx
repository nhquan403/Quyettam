import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { getMeta, setMeta } from './lib/settings';
import './index.css';

void (async () => {
  if (!(await getMeta<number>('firstUseAt'))) await setMeta('firstUseAt', Date.now());
  // Ask the browser not to evict our IndexedDB data under storage pressure.
  if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
