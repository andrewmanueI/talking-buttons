import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useButtons } from '../hooks/useButtons';
import { useLanguage } from '../i18n/LanguageContext';
import { BUTTON_COLORS, DEFAULT_BUTTON_COLOR } from '../types';
import AnimatedScreen from '../components/motion/AnimatedScreen';
import AnimatedStep from '../components/motion/AnimatedStep';
import AudioRecorder from '../components/AudioRecorder';
import ImagePicker from '../components/ImagePicker';
import ButtonPreview from '../components/ButtonPreview';

export default function AddButtonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const editId = (location.state as any)?.editId as string | undefined;
  const { buttons, add, update } = useButtons();
  const existing = editId ? buttons.find((b) => b.id === editId) : null;
  const isEdit = !!existing;

  const [step, setStep] = useState<'record' | 'name' | 'image' | 'color' | 'preview'>('record');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [buttonColor, setButtonColor] = useState(DEFAULT_BUTTON_COLOR);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (existing && !initialized) {
      setName(existing.name);
      setImageData(existing.imageData || null);
      setButtonColor(existing.buttonColor || DEFAULT_BUTTON_COLOR);
      if (existing.audioBlob) {
        setAudioBlob(existing.audioBlob);
        setAudioUrl(URL.createObjectURL(existing.audioBlob));
      }
      setStep('name');
      setInitialized(true);
    }
  }, [existing, initialized]);

  const handleSave = async () => {
    if (!audioBlob || !name.trim()) return;
    setSaving(true);
    if (isEdit && editId) {
      await update(editId, {
        name: name.trim(),
        audioBlob,
        imageData: imageData || undefined,
        buttonColor: imageData ? undefined : buttonColor,
      });
    } else {
      await add({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name.trim(),
        audioBlob,
        imageData: imageData || undefined,
        buttonColor: imageData ? undefined : buttonColor,
      });
    }
    navigate('/board');
  };

  const playAudio = () => {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.play();
    }
  };

  const steps: Array<'record' | 'name' | 'image' | 'color' | 'preview'> = ['record', 'name', 'image', 'color', 'preview'];
  const stepIcons: Record<string, string> = { record: '🎙', name: '📝', image: '🖼', color: '🎨', preview: '✅' };

  return (
    <AnimatedScreen>
      <main className="page add-page">
        <div className="add-steps">
          {steps.map((s) => {
            let done = false;
            if (s === 'record') done = !!audioBlob;
            if (s === 'name') done = name.trim().length > 0;
            if (s === 'image') done = !!imageData;
            return (
              <div key={s} className={`step-indicator ${step === s ? 'active' : ''} ${done ? 'done' : ''}`}>
                <span className="step-icon">{stepIcons[s]}</span>
                <span className="step-label">{t(`stepLabel_${s}` as any)}</span>
              </div>
            );
          })}
        </div>

        <div className="add-content">
          <AnimatedStep stepKey={step}>
            {step === 'record' && (
              <div className="add-step-content">
                <h2 className="step-title">{t('recordAudio')}</h2>
                <p className="step-hint">{t('recordHint')}</p>
                <AudioRecorder
                  audioBlob={audioBlob}
                  audioUrl={audioUrl}
                  onAudioReady={(blob, url) => { setAudioBlob(blob); setAudioUrl(url); }}
                />
                <div className="step-actions">
                  <button className="tb-btn btn-cancel" onClick={() => navigate('/board')}>{t('cancel')}</button>
                  <button className="tb-btn btn-primary" disabled={!audioBlob} onClick={() => setStep('name')}>{t('next')}</button>
                </div>
              </div>
            )}

            {step === 'name' && (
              <div className="add-step-content">
                <h2 className="step-title">{t('buttonName')}</h2>
                <p className="step-hint">{t('nameHint')}</p>
                <input
                  className="tb-input"
                  type="text"
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  maxLength={30}
                  onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) setStep('image'); }}
                />
                <div className="step-actions">
                  <button className="tb-btn btn-cancel" onClick={() => setStep('record')}>{t('back')}</button>
                  <button className="tb-btn btn-primary" disabled={!name.trim()} onClick={() => setStep('image')}>{t('next')}</button>
                </div>
              </div>
            )}

            {step === 'image' && (
              <div className="add-step-content">
                <h2 className="step-title">{t('chooseImage')}</h2>
                <p className="step-hint">{t('imageHint')}</p>
                <ImagePicker imageData={imageData} onImageSelected={setImageData} />
                {audioUrl && (
                  <div className="audio-check">
                    <button className="tb-btn btn-secondary" onClick={playAudio}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                      {t('playRecording')}
                    </button>
                  </div>
                )}
                <div className="step-actions">
                  <button className="tb-btn btn-cancel" onClick={() => setStep('name')}>{t('back')}</button>
                  <button className="tb-btn btn-primary" onClick={() => setStep('color')}>{t('next')}</button>
                </div>
              </div>
            )}

            {step === 'color' && (
              <div className="add-step-content">
                <h2 className="step-title">{t('chooseColor')}</h2>
                <p className="step-hint">{t('colorHint')}{imageData ? ` ${t('colorHintImg')}` : ''}</p>
                <div className="color-picker-section">
                  <div className="color-picker-grid">
                    {BUTTON_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`color-picker-swatch ${buttonColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setButtonColor(color)}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="step-actions">
                  <button className="tb-btn btn-cancel" onClick={() => setStep('image')}>{t('back')}</button>
                  <button className="tb-btn btn-primary" onClick={() => setStep('preview')}>{t('next')}</button>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="add-step-content">
                <h2 className="step-title">{isEdit ? t('updateButton') : t('saveButton')}</h2>
                <ButtonPreview name={name} imageData={imageData} buttonColor={buttonColor} />
                {audioUrl && (
                  <div className="audio-check">
                    <button className="tb-btn btn-secondary" onClick={playAudio}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                      {t('playRecording')}
                    </button>
                  </div>
                )}
                <div className="step-actions">
                  <button className="tb-btn btn-cancel" onClick={() => setStep('color')}>{t('back')}</button>
                  <button className="tb-btn btn-primary" disabled={saving} onClick={handleSave}>
                    {saving ? t('saving') : isEdit ? t('updateButton') : t('saveButton')}
                  </button>
                </div>
              </div>
            )}
          </AnimatedStep>
        </div>
      </main>
    </AnimatedScreen>
  );
}
