import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {GlobalPreferenceControls, UiPreferencesProvider} from './uiPreferences';
import {PartisanLocalizationCleanup} from './partisanLocalization';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiPreferencesProvider>
      <App />
      <GlobalPreferenceControls />
      <PartisanLocalizationCleanup />
    </UiPreferencesProvider>
  </StrictMode>,
);
