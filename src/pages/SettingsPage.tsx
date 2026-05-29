import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { useLanguage } from '../i18n/LanguageContext';
import { clearAllData, exportAllData, importAllData } from '../db';
import AnimatedScreen from '../components/motion/AnimatedScreen';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import type { BackgroundType, ExportData } from '../types';

const isNative = !!(window as any).Capacitor;

function resizeWallpaper(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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
  const [importPending, setImportPending] = useState<ExportData | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [wallpaperError, setWallpaperError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleReset = async () => {
    await clearAllData();
    window.location.hash = '#/board';
    window.location.reload();
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      console.log('[SettingsPage] no file selected');
      return;
    }

    console.log('[SettingsPage] file selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    try {
      const dataUrl = await resizeWallpaper(file, 1280);
      console.log('[SettingsPage] resized, dataUrl length:', dataUrl.length);
      setWallpaperError(null);
      update({ backgroundType: 'image', backgroundImage: dataUrl });
    } catch (err: any) {
      console.error('[SettingsPage] wallpaper upload failed:', err?.message);
      setWallpaperError(err?.message || 'Failed to load image');
    }

    // Clear input so selecting the same file again still fires onChange
    input.value = '';
  };

  const handleBgTypeChange = (type: BackgroundType) => {
    setWallpaperError(null);
    if (type === 'none') update({ backgroundType: 'none', backgroundImage: undefined });
    if (type === 'color') update({ backgroundType: 'color', backgroundImage: undefined });
    if (type === 'image') update({ backgroundType: 'image' });
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const filename = `talking-buttons-backup-${new Date().toISOString().slice(0, 10)}.json`;

      if (isNative) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const result = await Filesystem.writeFile({
          path: filename,
          data: json,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: 'Talking Buttons Backup',
          text: 'Talking Buttons backup file',
          url: result.uri,
          dialogTitle: 'Save backup',
        });
      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      setToast(`Exported: ${filename}`);
    } catch (err) {
      console.error('[SettingsPage] export failed', err);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setImportError(null);

    try {
      const text = await file.text();
      const parsed: ExportData = JSON.parse(text);

      if (!parsed || parsed.version !== 1 || !parsed.data) {
        throw new Error('Invalid format');
      }

      setImportFileName(file.name);
      setImportPending(parsed);
    } catch (err) {
      console.error('[SettingsPage] import parse failed', err);
      setImportError(t('invalidImportFile'));
    }

    input.value = '';
  };

  const handleImportConfirm = async () => {
    if (!importPending) return;
    try {
      await importAllData(importPending);
      setImportPending(null);
      setToast(`Imported from: ${importFileName}`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('[SettingsPage] import failed', err);
    }
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
                {wallpaperError && (
                  <p className="wallpaper-error">{wallpaperError}</p>
                )}
                {settings.backgroundImage && (
                  <div className="wallpaper-preview">
                    <img src={settings.backgroundImage} alt="Wallpaper preview" />
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-heading">{t('data')}</h3>
          <p className="privacy-note">{t('privacyNote')}</p>
          <div className="data-actions">
            <button className="tb-btn btn-secondary" onClick={handleExport}>{t('exportData')}</button>
            <button className="tb-btn btn-secondary" onClick={() => importFileRef.current?.click()}>{t('importData')}</button>
            {importError && <p className="wallpaper-error">{importError}</p>}
          </div>
          <button className="tb-btn btn-danger" onClick={() => setShowReset(true)}>{t('resetData')}</button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
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

        {importPending && (
          <ConfirmDialog
            title={t('importConfirmTitle')}
            message={t('importConfirmMsg')}
            confirmLabel={t('importData')}
            onConfirm={handleImportConfirm}
            onCancel={() => setImportPending(null)}
          />
        )}

        <div className="settings-back">
          <button className="tb-btn btn-secondary" onClick={() => navigate('/board')}>{t('backToBoard')}</button>
        </div>

        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      </main>
    </AnimatedScreen>
  );
}
