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

type Mode = 'record' | 'tts';
type Step = 'record' | 'tts' | 'name' | 'image' | 'color' | 'preview';

export default function AddButtonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const editId = (location.state as any)?.editId as string | undefined;
  const { buttons, add, update } = useButtons();
  const existing = editId ? buttons.find((b) => b.id === editId) : null;
  const isEdit = !!existing;

  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState<Step>('record');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState('');
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
      if (existing.ttsText) {
        setMode('tts');
        setTtsText(existing.ttsText);
      } else if (existing.audioBlob) {
        setMode('record');
        setAudioBlob(existing.audioBlob);
        setAudioUrl(URL.createObjectURL(existing.audioBlob));
      }
      setStep(existing.ttsText ? 'image' : 'name');
      setInitialized(true);
    }
  }, [existing, initialized]);

  const imageStepBack = mode === 'tts' ? 'tts' : 'name';

  const handleSave = async () => {
    if (mode === 'record') {
      if (!audioBlob || !name.trim()) return;
    } else {
      if (!ttsText.trim() || !name.trim()) return;
    }
    setSaving(true);

    const base = {
      name: name.trim(),
      imageData: imageData || undefined,
      buttonColor: imageData ? undefined : buttonColor,
    };

    if (isEdit && editId) {
      if (mode === 'tts') {
        await update(editId, { ...base, ttsText: ttsText.trim(), audioBlob: undefined });
      } else {
        await update(editId, { ...base, audioBlob: audioBlob!, ttsText: undefined });
      }
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      if (mode === 'tts') {
        await add({ id, ...base, ttsText: ttsText.trim() });
      } else {
        await add({ id, ...base, audioBlob: audioBlob! });
      }
    }
    navigate('/board');
  };

  const playAudio = () => {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.play();
    }
  };

  const wizardSteps: Step[] = mode === 'tts'
    ? ['tts', 'image', 'color', 'preview']
    : ['record', 'name', 'image', 'color', 'preview'];

  const stepIcons: Record<string, React.ReactNode> = {
    record: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z" />
        <path d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z" />
      </svg>
    ),
    tts: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    ),
    name: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    image: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    color: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a7 7 0 0 1 7 7c0 2-1 3.5-2.5 4.5S14 15 14 17a2 2 0 0 1-4 0c0-2 .5-3.5 2-4.5S13.5 11 13.5 9a5 5 0 0 0-10 0c0 2 .5 3.5 2 4.5S7 15 7 17" />
      </svg>
    ),
    preview: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  };

  const handleModeSelect = (m: Mode) => {
    setMode(m);
    setStep(m === 'tts' ? 'tts' : 'record');
  };

  // Mode picker screen (shown before wizard)
  if (mode === null) {
    return (
      <AnimatedScreen>
        <main className="page add-page">
          <div className="mode-picker">
            <h2 className="step-title">{t('chooseMode')}</h2>
            <div className="mode-cards">
              <button className="mode-card" onClick={() => handleModeSelect('record')}>
                <div className="mode-card-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z" />
                    <path d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z" />
                  </svg>
                </div>
                <div className="mode-card-title">{t('recordMode')}</div>
                <div className="mode-card-hint">{t('recordModeHint')}</div>
              </button>
              <button className="mode-card" onClick={() => handleModeSelect('tts')}>
                <div className="mode-card-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                </div>
                <div className="mode-card-title">{t('ttsMode')}</div>
                <div className="mode-card-hint">{t('ttsModeHint')}</div>
              </button>
            </div>
            <div className="step-actions">
              <button className="tb-btn btn-cancel" onClick={() => navigate('/board')}>{t('cancel')}</button>
            </div>
          </div>
        </main>
      </AnimatedScreen>
    );
  }

  // Wizard
  return (
    <AnimatedScreen>
      <main className="page add-page">
        <div className="add-steps">
          {wizardSteps.map((s) => {
            let done = false;
            if (s === 'record') done = !!audioBlob;
            if (s === 'tts') done = ttsText.trim().length > 0;
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

            {step === 'tts' && (
              <div className="add-step-content">
                <h2 className="step-title">{t('ttsTextLabel')}</h2>
                <p className="step-hint">{t('ttsTextHint')}</p>
                <textarea
                  className="tb-input tts-textarea"
                  placeholder={t('ttsTextPlaceholder')}
                  value={ttsText}
                  onChange={(e) => { setTtsText(e.target.value); setName(e.target.value); }}
                  autoFocus
                  maxLength={200}
                  rows={4}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && ttsText.trim()) setStep('image'); }}
                />
                <div className="step-actions">
                  <button className="tb-btn btn-cancel" onClick={() => navigate('/board')}>{t('cancel')}</button>
                  <button className="tb-btn btn-primary" disabled={!ttsText.trim()} onClick={() => setStep('image')}>{t('next')}</button>
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
                  <button className="tb-btn btn-cancel" onClick={() => setStep(mode === 'tts' ? 'tts' : 'record')}>{t('back')}</button>
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
                  <button className="tb-btn btn-cancel" onClick={() => setStep(imageStepBack)}>{t('back')}</button>
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
