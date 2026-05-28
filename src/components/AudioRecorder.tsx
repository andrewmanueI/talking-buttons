import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  audioBlob: Blob | null;
  audioUrl: string | null;
  onAudioReady: (blob: Blob, url: string) => void;
}

function errorKey(kind: string) {
  switch (kind) {
    case 'denied':      return 'micDenied';
    case 'nomic':       return 'micNotFound';
    case 'unavailable': return 'micUnavailable';
    case 'recorder':    return 'micRecorderError';
    default:            return 'micError';
  }
}

export default function AudioRecorder({ audioBlob, audioUrl, onAudioReady }: Props) {
  const recorder = useAudioRecorder();
  const { t } = useLanguage();

  const handleStart = async () => {
    await recorder.start();
  };

  const handleStop = () => {
    recorder.stop();
  };

  const handleAccept = () => {
    if (recorder.audioBlob && recorder.audioUrl) {
      onAudioReady(recorder.audioBlob, recorder.audioUrl);
    }
  };

  if (audioBlob && audioUrl) {
    return (
      <div className="recorder-section done">
        <div className="recorder-label">{t('audioRecorded')}</div>
        <button className="tb-btn btn-secondary" onClick={() => { const a = new Audio(audioUrl); a.play(); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
          {t('play')}
        </button>
        <button className="tb-btn btn-secondary" onClick={recorder.reset}>{t('rerecord')}</button>
      </div>
    );
  }

  return (
    <div className="recorder-section">
      <div className="recorder-label">
        {recorder.state === 'idle' && !recorder.error && t('recordForButton')}
        {recorder.state === 'recording' && t('recording')}
        {recorder.state === 'done' && t('reviewRecording')}
      </div>

      {recorder.error && (
        <div className="recorder-error-block">
          <p className="recorder-error">{t(errorKey(recorder.error.kind))}</p>
          <button className="tb-btn btn-secondary" onClick={handleStart}>
            {t('tryAgain')}
          </button>
        </div>
      )}

      {!recorder.error && recorder.state === 'idle' && (
        <button className="tb-btn record-btn" onClick={handleStart} aria-label="Start recording">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z" />
            <path d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z" />
          </svg>
        </button>
      )}

      {!recorder.error && recorder.state === 'recording' && (
        <div className="recording-active">
          <span className="recording-pulse" />
          <button className="tb-btn stop-btn" onClick={handleStop} aria-label="Stop recording">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        </div>
      )}

      {!recorder.error && recorder.state === 'done' && (
        <div className="recording-review">
          <button className="tb-btn btn-secondary" onClick={recorder.play}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            {t('play')}
          </button>
          <button className="tb-btn btn-secondary" onClick={recorder.reset}>{t('rerecord')}</button>
          <button className="tb-btn btn-primary" onClick={handleAccept}>{t('useRecording')}</button>
        </div>
      )}
    </div>
  );
}
