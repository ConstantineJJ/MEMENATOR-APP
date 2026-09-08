import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {GlobalPreferenceControls, UiPreferencesProvider} from './uiPreferences';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiPreferencesProvider>
      <App />
      <GlobalPreferenceControls />
    </UiPreferencesProvider>
  </StrictMode>,
);
