import { useState, useEffect, useRef, useCallback } from 'react';
import { getSettings } from '../db';
import { AUDIO_CONSTRAINTS, classifyError, stopStream } from '../hooks/useAudioRecorder';

// ── Types ─────────────────────────────────────────────────

type CheckName = 'db' | 'mic' | 'audio';
type CheckStatus = 'pending' | 'running' | 'pass' | 'fail';

interface CheckResult {
  name: CheckName;
  status: CheckStatus;
  message: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  text: string;
  kind: CheckStatus;
}

type Phase = 'checking' | 'blocked' | 'fade-out' | 'done';

interface Props {
  ready: boolean;
  minDuration?: number;
  onFinished: () => void;
}

// ── Helpers ────────────────────────────────────────────────

const CHECK_LABELS: Record<CheckName, string> = {
  db:    'IndexedDB',
  mic:   'Microphone',
  audio: 'Audio Output',
};

function fmtTime(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

let _logId = 0;

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

    // Play a silent 1-sample buffer to exercise the full audio pipeline
    const buffer = ac.createBuffer(1, 1, ac.sampleRate);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.connect(ac.destination);
    source.start(0);

    // Wait for the silent buffer to complete
    await new Promise((r) => setTimeout(r, 100));
    await ac.close();
    ctx = null;
    return { name: 'audio', status: 'pass', message: 'Audio output functional' };
  } catch (err: any) {
    if (ctx) { try { await ctx.close(); } catch {} }
    return { name: 'audio', status: 'fail', message: err?.message || String(err) };
  }
}

// ── App Icon (matching speaker icon from SoundButton) ──────

const AppIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

// ── Component ──────────────────────────────────────────────

export default function InitScreen({ ready, minDuration = 1800, onFinished }: Props) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [checks, setChecks] = useState<Record<CheckName, CheckResult>>({
    db:    { name: 'db',    status: 'pending', message: '' },
    mic:   { name: 'mic',   status: 'pending', message: '' },
    audio: { name: 'audio', status: 'pending', message: '' },
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const mountTime = useRef(Date.now());
  const finishedRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const blockedCheck = useRef<CheckName | null>(null);

  // ── Logging helper ─────────────────────────────────────

  const addLog = useCallback((text: string, kind: CheckStatus) => {
    const entry: LogEntry = { id: ++_logId, timestamp: fmtTime(), text, kind };
    setLogs((prev) => [...prev, entry]);
  }, []);

  // ── Probe runner ───────────────────────────────────────

  const runProbes = useCallback(async () => {
    const probes: [CheckName, () => Promise<CheckResult>][] = [
      ['db',    probeDatabase],
      ['mic',   probeMicrophone],
      ['audio', probeAudioOutput],
    ];
    addLog('── init ──', 'pending');

    for (const [name, fn] of probes) {
      // Mark running
      setChecks((prev) => ({ ...prev, [name]: { ...prev[name], status: 'running' } }));
      addLog(`${CHECK_LABELS[name]}...`, 'running');

      const result = await fn();

      setChecks((prev) => ({ ...prev, [name]: result }));
      addLog(`${CHECK_LABELS[name]}: ${result.status === 'pass' ? 'OK' : 'FAIL'}`, result.status);

      if (result.status === 'fail') {
        addLog(`  ${result.message}`, 'fail');
        blockedCheck.current = name;
        setPhase('blocked');
        return;
      }

      if (result.message) {
        addLog(`  ${result.message}`, 'pass');
      }
    }

    // All passed — wait for ready + minDuration
    addLog('All checks passed', 'pass');
  }, [addLog]);

  // ── Run probes once on mount ───────────────────────────

  useEffect(() => {
    runProbes();
  }, [runProbes]);

  // ── Auto-scroll log ────────────────────────────────────

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

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
    });
    setLogs([]);
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
      {/* Icon */}
      <div className="init-icon-wrap">
        <div className="init-icon">
          <AppIcon />
        </div>
      </div>

      {/* Title */}
      <h1 className="init-title">Talking Buttons</h1>

      {/* Log area */}
      <div className="init-log">
        {logs.map((entry) => (
          <div key={entry.id} className={`init-log-line kind-${entry.kind}`}>
            [{entry.timestamp}] {entry.text}
          </div>
        ))}
        {phase === 'checking' && (
          <div className="init-log-line kind-running">_</div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* Blocked card */}
      {phase === 'blocked' && failedCheck && (
        <div className="init-blocked">
          <div className="init-blocked-title">{CHECK_LABELS[failedCheck.name]} Failed</div>
          <div className="init-blocked-detail">{failedCheck.message}</div>
          <button className="tb-btn btn-primary" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Dots (only while checking) */}
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
