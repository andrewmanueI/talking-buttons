import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSettings } from './hooks/useSettings';
import ErrorBoundary from './components/ErrorBoundary';
import InitScreen from './components/InitScreen';
import TopBar from './components/TopBar';
import BoardPage from './pages/BoardPage';
import AddButtonPage from './pages/AddButtonPage';
import SettingsPage from './pages/SettingsPage';
import PresetsPage from './pages/PresetsPage';

function Background({ settings }: { settings: ReturnType<typeof useSettings>['settings'] }) {
  let style: React.CSSProperties = {};

  if (settings.backgroundType === 'color') {
    style.backgroundColor = settings.backgroundColor;
  }

  if (settings.backgroundType === 'image' && settings.backgroundImage) {
    style.backgroundImage = `url(${settings.backgroundImage})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
    style.backgroundRepeat = 'no-repeat';
  }

  return (
    <>
      <div className="bg-layer" style={style} />
      {settings.backgroundType === 'image' && settings.backgroundImage && (
        <div className="bg-scrim" />
      )}
    </>
  );
}

const APP_VERSION = '1.1.10';

function logAppInfo() {
  const isNative = !!(window as any).Capacitor;
  const ua = navigator.userAgent;
  const platform = isNative ? 'Android (Capacitor)' : 'Web';
  const lang = navigator.language;

  console.log(`[App] version ${APP_VERSION}, platform: ${platform}, lang: ${lang}, ua: ${ua}`);
  console.log(`[App] initialization complete — all probes passed`);
}

export default function App() {
  const { settings, loading } = useSettings();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return (
      <ErrorBoundary>
        <InitScreen ready={!loading} onFinished={() => { logAppInfo(); setSplashDone(true); }} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app" data-bg-type={settings.backgroundType}>
        <Background settings={settings} />
        <TopBar />
        <Routes>
          <Route path="/" element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/add" element={<AddButtonPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/presets" element={<PresetsPage />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}
