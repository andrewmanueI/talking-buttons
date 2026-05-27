import { Routes, Route, Navigate } from 'react-router-dom';
import { useSettings } from './hooks/useSettings';
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

  return <div className="bg-layer" style={style} />;
}

export default function App() {
  const { settings, loading } = useSettings();

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className="app">
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
  );
}
