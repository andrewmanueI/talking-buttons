import { useState, useEffect, useRef, useCallback } from 'react';
import { getSettings } from '../db';
import { AUDIO_CONSTRAINTS, classifyError, stopStream } from '../hooks/useAudioRecorder';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// ── Types ─────────────────────────────────────────────────

type CheckName = 'db' | 'mic' | 'audio' | 'tts';
type CheckStatus = 'pending' | 'running' | 'pass' | 'fail';

interface CheckResult {
  name: CheckName;
  status: CheckStatus;
  message: string;
}

type Phase = 'checking' | 'blocked' | 'fade-out' | 'done';

interface Props {
  ready: boolean;
  minDuration?: number;
  onFinished: () => void;
}

// ── Labels ────────────────────────────────────────────────

const CHECK_LABELS: Record<CheckName, string> = {
  db:    'IndexedDB',
  mic:   'Microphone',
  audio: 'Audio Output',
  tts:   'Text-to-Speech',
};

// ── Probes ─────────────────────────────────────────────────

async function probeDatabase(): Promise<CheckResult> {
  try {
    const saved = await getSettings();
    return {
      name: 'db',
      status: 'pass',
      message: saved ? 'Settings read OK' : 'No settings (fresh start)',
    };
  } catch (err: any) {
    return {
      name: 'db',
      status: 'fail',
      message: err?.message || String(err),
    };
  }
}

async function probeMicrophone(): Promise<CheckResult> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      name: 'mic',
      status: 'fail',
      message: 'mediaDevices API not available',
    };
  }

  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
    stopStream(stream);
    return { name: 'mic', status: 'pass', message: 'Microphone accessible' };
  } catch (err: any) {
    stopStream(stream);
    const classified = classifyError(err);
    return { name: 'mic', status: 'fail', message: classified.message };
  }
}

async function probeTts(): Promise<CheckResult> {
  const isNative = !!(window as any).Capacitor;

  try {
    const result = await TextToSpeech.isLanguageSupported({ lang: 'id-ID' });
    let message = 'TTS ready';
    if (result.supported) message = 'TTS ready (id-ID)';
    else message = 'TTS available but id-ID voice data missing';

    if (isNative) {
      try {
        const voices = await TextToSpeech.getSupportedVoices();
        if (voices?.voices?.length) {
          console.log('[TTS] Supported voices:', voices.voices.map((v: any) =>
            `${v.name} (${v.lang})`
          ).join(', '));
        }
      } catch {}
    }

    return { name: 'tts', status: 'pass', message };
  } catch (err: any) {
    if (isNative) {
      return { name: 'tts', status: 'fail', message: err?.message || String(err) };
    }
    return { name: 'tts', status: 'pass', message: 'TTS not available in browser' };
  }
}

async function probeAudioOutput(): Promise<CheckResult> {
  const ACtor = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!ACtor) {
    return { name: 'audio', status: 'fail', message: 'AudioContext not available' };
  }

  let ctx: AudioContext | null = null;
  try {
    const ac = new ACtor();
    ctx = ac;
    if (ac.state === 'suspended') await ac.resume();

    const buffer = ac.createBuffer(1, 1, ac.sampleRate);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.connect(ac.destination);
    source.start(0);

    await new Promise((r) => setTimeout(r, 100));
    await ac.close();
    ctx = null;
    return { name: 'audio', status: 'pass', message: 'Audio output functional' };
  } catch (err: any) {
    if (ctx) { try { await ctx.close(); } catch {} }
    return { name: 'audio', status: 'fail', message: err?.message || String(err) };
  }
}

// ── App Icon ─────────────────────────────────────────────

const AppIcon = () => (
  <img src="icons/icon-192.png" alt="Talking Buttons" className="init-icon-img" />
);

// ── Component ──────────────────────────────────────────────

export default function InitScreen({ ready, minDuration = 1800, onFinished }: Props) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [checks, setChecks] = useState<Record<CheckName, CheckResult>>({
    db:    { name: 'db',    status: 'pending', message: '' },
    mic:   { name: 'mic',   status: 'pending', message: '' },
    audio: { name: 'audio', status: 'pending', message: '' },
    tts:   { name: 'tts',   status: 'pending', message: '' },
  });
  const mountTime = useRef(Date.now());
  const finishedRef = useRef(false);
  const blockedCheck = useRef<CheckName | null>(null);

  // ── Probe runner ───────────────────────────────────────

  const runProbes = useCallback(async () => {
    const probes: [CheckName, () => Promise<CheckResult>][] = [
      ['db',    probeDatabase],
      ['mic',   probeMicrophone],
      ['audio', probeAudioOutput],
      ['tts',   probeTts],
    ];

    for (const [name, fn] of probes) {
      setChecks((prev) => ({ ...prev, [name]: { ...prev[name], status: 'running' } }));

      const result = await fn();
      setChecks((prev) => ({ ...prev, [name]: result }));

      if (result.status === 'fail') {
        blockedCheck.current = name;
        setPhase('blocked');
        return;
      }
    }
  }, []);

  // ── Run probes once on mount ───────────────────────────

  useEffect(() => {
    runProbes();
  }, [runProbes]);

  // ── Fade-out on success ────────────────────────────────

  useEffect(() => {
    if (phase !== 'checking') return;
    const allPassed = Object.values(checks).every((c) => c.status === 'pass');
    if (!allPassed || !ready) return;

    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, minDuration - elapsed);

    const id = setTimeout(() => setPhase('fade-out'), remaining);
    return () => clearTimeout(id);
  }, [phase, checks, ready, minDuration]);

  // ── Handle fade-out finish ─────────────────────────────

  const handleAnimationEnd = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase('done');
    onFinished();
  }, [onFinished]);

  useEffect(() => {
    if (phase !== 'fade-out') return;
    const id = setTimeout(handleAnimationEnd, 500);
    return () => clearTimeout(id);
  }, [phase, handleAnimationEnd]);

  // ── Retry ──────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    mountTime.current = Date.now();
    blockedCheck.current = null;
    setChecks({
      db:    { name: 'db',    status: 'pending', message: '' },
      mic:   { name: 'mic',   status: 'pending', message: '' },
      audio: { name: 'audio', status: 'pending', message: '' },
      tts:   { name: 'tts',   status: 'pending', message: '' },
    });
    setPhase('checking');
    runProbes();
  }, [runProbes]);

  // ── Render ─────────────────────────────────────────────

  if (phase === 'done') return null;

  const failedCheck = phase === 'blocked' && blockedCheck.current
    ? checks[blockedCheck.current]
    : null;

  return (
    <div
      className={`init-screen${phase === 'fade-out' ? ' init-exiting' : ''}`}
      onAnimationEnd={phase === 'fade-out' ? handleAnimationEnd : undefined}
    >
      <div className="init-icon-wrap">
        <AppIcon />
      </div>

      <h1 className="init-title">Talking Buttons</h1>

      {phase === 'blocked' && failedCheck && (
        <div className="init-blocked">
          <div className="init-blocked-title">{CHECK_LABELS[failedCheck.name]} Failed</div>
          <div className="init-blocked-detail">{failedCheck.message}</div>
          <button className="tb-btn btn-primary" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {phase === 'checking' && (
        <div className="init-dots">
          <span className="init-dot" style={{ animationDelay: '0ms' }} />
          <span className="init-dot" style={{ animationDelay: '150ms' }} />
          <span className="init-dot" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}
