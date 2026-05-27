import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { useLanguage } from '../i18n/LanguageContext';
import { clearAllData } from '../db';
import AnimatedScreen from '../components/motion/AnimatedScreen';
import ConfirmDialog from '../components/ConfirmDialog';
import type { BackgroundType } from '../types';

const BG_COLORS = [
  { value: '#F6F3EE', key: 'softCream' },
  { value: '#F8F5F0', key: 'warmWhite' },
  { value: '#F3F4F6', key: 'softGray' },
  { value: '#EAF4FF', key: 'paleBlue' },
  { value: '#EEF7FF', key: 'skyMist' },
  { value: '#EAFBF0', key: 'softMint' },
  { value: '#EEF6EA', key: 'lightSage' },
  { value: '#F1ECFF', key: 'softLavender' },
  { value: '#FFF1E8', key: 'softPeach' },
  { value: '#FFF0F3', key: 'softRose' },
  { value: '#FFF8D6', key: 'softButter' },
  { value: '#F4EAD5', key: 'softSand' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { t } = useLanguage();
  const [showReset, setShowReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleReset = async () => {
    await clearAllData();
    window.location.hash = '#/board';
    window.location.reload();
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update({ backgroundType: 'image', backgroundImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleBgTypeChange = (type: BackgroundType) => {
    if (type === 'none') update({ backgroundType: 'none', backgroundImage: undefined });
    if (type === 'color') update({ backgroundType: 'color', backgroundImage: undefined });
    if (type === 'image') update({ backgroundType: 'image' });
  };

  return (
    <AnimatedScreen>
      <main className="page settings-page">
        <h2 className="page-title">{t('settings')}</h2>

        <section className="settings-section">
          <h3 className="settings-heading">{t('background')}</h3>

          <div className="setting-row">
            <label className="setting-label">
              <input
                type="radio"
                name="bg"
                checked={settings.backgroundType === 'none'}
                onChange={() => handleBgTypeChange('none')}
              />
              {t('noBackground')}
            </label>
          </div>

          <div className="setting-row">
            <label className="setting-label">
              <input
                type="radio"
                name="bg"
                checked={settings.backgroundType === 'color'}
                onChange={() => handleBgTypeChange('color')}
              />
              {t('solidColor')}
            </label>
            {settings.backgroundType === 'color' && (
              <div className="color-options">
                {BG_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`color-swatch ${settings.backgroundColor === c.value ? 'selected' : ''}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => update({ backgroundColor: c.value })}
                    title={t(c.key as any)}
                    aria-label={t(c.key as any)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="setting-row">
            <label className="setting-label">
              <input
                type="radio"
                name="bg"
                checked={settings.backgroundType === 'image'}
                onChange={() => handleBgTypeChange('image')}
              />
              {t('wallpaper')}
            </label>
            {settings.backgroundType === 'image' && (
              <div className="wallpaper-actions">
                <button className="tb-btn btn-secondary" onClick={() => fileRef.current?.click()}>
                  {t('chooseWallpaper')}
                </button>
                {settings.backgroundImage && (
                  <button className="tb-btn btn-cancel" onClick={() => update({ backgroundImage: undefined, backgroundType: 'none' })}>
                    {t('removeWallpaper')}
                  </button>
                )}
                {settings.backgroundImage && (
                  <div className="wallpaper-preview">
                    <img src={settings.backgroundImage} alt="Wallpaper preview" />
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleWallpaperUpload} style={{ display: 'none' }} />
              </div>
            )}
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-heading">{t('data')}</h3>
          <p className="privacy-note">{t('privacyNote')}</p>
          <button className="tb-btn btn-danger" onClick={() => setShowReset(true)}>{t('resetData')}</button>
        </section>

        {showReset && (
          <ConfirmDialog
            title={t('resetAllData')}
            message={t('resetAllDataMsg')}
            confirmLabel={t('resetEverything')}
            onConfirm={handleReset}
            onCancel={() => setShowReset(false)}
            danger
          />
        )}

        <div className="settings-back">
          <button className="tb-btn btn-secondary" onClick={() => navigate('/board')}>{t('backToBoard')}</button>
        </div>
      </main>
    </AnimatedScreen>
  );
}
