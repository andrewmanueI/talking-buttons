import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePresets } from '../hooks/usePresets';
import { useButtons } from '../hooks/useButtons';
import { useSettings } from '../hooks/useSettings';
import { useLanguage } from '../i18n/LanguageContext';
import { deleteAllButtons, addButtons } from '../db';
import AnimatedScreen from '../components/motion/AnimatedScreen';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import PresetCard from '../components/PresetCard';
import type { SavedPreset, PresetButton } from '../types';

export default function PresetsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { presets, loading, save, remove } = usePresets();
  const { buttons, refresh: refreshButtons } = useButtons();
  const { settings } = useSettings();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadTarget, setLoadTarget] = useState<SavedPreset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedPreset | null>(null);

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    setSaving(true);
    const presetButtons: PresetButton[] = buttons.map((b) => ({
      id: b.id,
      name: b.name,
      audioBlob: b.audioBlob,
      imageData: b.imageData,
      buttonColor: b.buttonColor,
      order: b.order,
    }));
    await save({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: presetName.trim(),
      buttons: presetButtons,
      backgroundColor: settings.backgroundColor,
      backgroundImage: settings.backgroundImage,
      backgroundType: settings.backgroundType,
      createdAt: Date.now(),
    });
    setShowSaveDialog(false);
    setPresetName('');
    setSaving(false);
  };

  const handleLoadPreset = async () => {
    if (!loadTarget) return;
    await deleteAllButtons();
    const restored: Array<{ id: string; name: string; audioBlob: Blob; imageData?: string; buttonColor?: string; order: number; createdAt: number }> = loadTarget.buttons.map((b) => ({
      id: b.id,
      name: b.name,
      audioBlob: b.audioBlob,
      imageData: b.imageData,
      buttonColor: b.buttonColor,
      order: b.order,
      createdAt: Date.now(),
    }));
    await addButtons(restored);
    await refreshButtons();
    setLoadTarget(null);
    navigate('/board');
  };

  const handleDeletePreset = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  };

  const boardHasButtons = buttons.length > 0;

  if (loading) {
    return (
      <AnimatedScreen>
        <main className="page"><p className="loading">{t('loading')}</p></main>
      </AnimatedScreen>
    );
  }

  return (
    <AnimatedScreen>
      <main className="page presets-page">
        <div className="presets-header">
          <h2 className="page-title" style={{ marginBottom: 0 }}>{t('presets')}</h2>
          {boardHasButtons && (
            <button className="tb-btn btn-primary" onClick={() => setShowSaveDialog(true)}>
              {t('saveCurrentBoard')}
            </button>
          )}
        </div>

        {!boardHasButtons && presets.length === 0 && (
          <EmptyState
            icon={
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.35">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            }
            title={t('noPresets')}
            message={t('noPresetsMsg')}
          />
        )}

        {presets.length > 0 && (
          <div className="presets-list">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                name={preset.name}
                buttonCount={preset.buttons.length}
                date={new Date(preset.createdAt).toLocaleDateString()}
                onLoad={() => setLoadTarget(preset)}
                onDelete={() => setDeleteTarget(preset)}
              />
            ))}
          </div>
        )}

        <div className="presets-back">
          <button className="tb-btn btn-secondary" onClick={() => navigate('/board')}>{t('backToBoard')}</button>
        </div>

        {showSaveDialog && (
          <div className="sheet-overlay" onClick={() => { setShowSaveDialog(false); setPresetName(''); }}>
            <div className="dialog glass-panel sheet-transition" onClick={(e) => e.stopPropagation()}>
              <h2 className="dialog-title">{t('savePreset')}</h2>
              <p className="dialog-message">{t('savePresetMsg', { count: buttons.length })}</p>
              <input
                className="dialog-input"
                type="text"
                placeholder={t('presetName')}
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                autoFocus
                maxLength={40}
                onKeyDown={(e) => { if (e.key === 'Enter' && presetName.trim()) handleSavePreset(); }}
              />
              <div className="dialog-actions">
                <button className="tb-btn btn-cancel" onClick={() => { setShowSaveDialog(false); setPresetName(''); }}>{t('cancel')}</button>
                <button className="tb-btn btn-primary" disabled={!presetName.trim() || saving} onClick={handleSavePreset}>
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {loadTarget && (
          <ConfirmDialog
            title={t('loadPresetQ')}
            message={`${t('loadPresetMsg', { current: buttons.length, target: loadTarget.buttons.length })} "${loadTarget.name}".`}
            confirmLabel={t('replaceBoard')}
            onConfirm={handleLoadPreset}
            onCancel={() => setLoadTarget(null)}
            danger
          />
        )}

        {deleteTarget && (
          <ConfirmDialog
            title={t('deletePresetQ')}
            message={`${t('deletePresetMsg')} "${deleteTarget.name}". ${t('deletePresetMsg2')}`}
            confirmLabel={t('deletePresetBtn')}
            onConfirm={handleDeletePreset}
            onCancel={() => setDeleteTarget(null)}
            danger
          />
        )}
      </main>
    </AnimatedScreen>
  );
}
