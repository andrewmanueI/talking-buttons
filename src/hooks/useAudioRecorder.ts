import { useState, useRef, useCallback, useEffect } from 'react';

type RecorderState = 'idle' | 'recording' | 'done';
type ErrorKind = 'denied' | 'nomic' | 'unavailable' | 'recorder' | 'generic';

export interface RecorderError {
  message: string;
  kind: ErrorKind;
}

// Android-friendly audio constraints. Explicit sampleRate and channelCount
// prevent "Could not start Audio Source" on Android WebView / Capacitor.
export const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: 44100,
  channelCount: 1,
};

// MIME types that work on Android WebView, ordered by reliability.
// We try WITHOUT a mimeType first (browser default), then fall back.
const MIME_CANDIDATES = [
  '',                          // browser default (safest on Android)
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

function supportsMime(mime: string): boolean {
  if (!mime) return true; // default always "supported"
  return MediaRecorder.isTypeSupported(mime);
}

export function classifyError(err: any): RecorderError {
  const name: string = err?.name ?? '';
  const message: string = err?.message ?? '';

  // "Could not start Audio Source" → Android AudioRecord failure
  if (
    name === 'NotReadableError' ||
    message.toLowerCase().includes('audio source') ||
    message.toLowerCase().includes('could not start') ||
    message.toLowerCase().includes('audiorecord')
  ) {
    return { message, kind: 'unavailable' };
  }

  // Permission denied
  if (name === 'NotAllowedError' || message.toLowerCase().includes('permission')) {
    return { message, kind: 'denied' };
  }

  // No microphone hardware
  if (name === 'NotFoundError' || message.toLowerCase().includes('device') || message.toLowerCase().includes('not found')) {
    return { message, kind: 'nomic' };
  }

  return { message, kind: 'generic' };
}

// Safe teardown of a MediaStream.
export function stopStream(s: MediaStream | null) {
  if (!s) return;
  s.getTracks().forEach((t) => t.stop());
}

// Safe teardown of a MediaRecorder.
function stopRecorder(r: MediaRecorder | null) {
  if (!r || r.state === 'inactive') return;
  try { r.stop(); } catch {}
}

let _seq = 0;

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<RecorderError | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);

  // Keep audioUrlRef in sync so onstop never reads a stale URL.
  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      stopRecorder(recorderRef.current);
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    const seq = ++_seq;
    console.log(`[recorder:${seq}] start requested`);

    setError(null);
    setState('idle');

    // ── Stage 0: mediaDevices API check ────────────────────
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error(`[recorder:${seq}] mediaDevices API not available`);
      setError({
        message: 'Audio recording is not supported in this environment.',
        kind: 'generic',
      });
      return;
    }

    // ── Stage 1: getUserMedia ──────────────────────────────
    console.log(`[recorder:${seq}] stage 1 — getUserMedia`, AUDIO_CONSTRAINTS);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
    } catch (err: any) {
      console.error(`[recorder:${seq}] getUserMedia FAILED`, {
        name: err?.name,
        message: err?.message,
        constraint: err?.constraint,
        stack: err?.stack,
      });
      setError(classifyError(err));
      return;
    }

    console.log(`[recorder:${seq}] getUserMedia OK`);

    // ── Stage 2: inspect audio tracks ──────────────────────
    streamRef.current = stream;
    const tracks = stream.getAudioTracks();
    console.log(`[recorder:${seq}] stage 2 — audio tracks: ${tracks.length}`);

    for (const t of tracks) {
      console.log(`[recorder:${seq}]   track:`, {
        kind: t.kind,
        label: t.label,
        readyState: t.readyState,
        enabled: t.enabled,
        muted: t.muted,
        settings: t.getSettings(),
        constraints: t.getConstraints(),
      });
    }

    if (tracks.length === 0) {
      console.error(`[recorder:${seq}] no audio tracks in stream`);
      stopStream(stream);
      streamRef.current = null;
      setError({ message: 'No audio track returned', kind: 'generic' });
      return;
    }

    // ── Stage 3: MediaRecorder (MIME fallback) ─────────────
    chunksRef.current = [];
    let recorder: MediaRecorder | null = null;
    let chosenMime = '';
    let lastErr: any = null;

    for (const mime of MIME_CANDIDATES) {
      if (mime && !supportsMime(mime)) {
        console.log(`[recorder:${seq}] stage 3 — MIME "${mime}" not supported, skip`);
        continue;
      }
      console.log(`[recorder:${seq}] stage 3 — trying MIME "${mime || '<default>'}"`);

      try {
        recorder = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);
        chosenMime = mime;
        lastErr = null;
        break;
      } catch (err: any) {
        console.warn(`[recorder:${seq}] MediaRecorder constructor FAILED for "${mime || '<default>'}"`, {
          name: err?.name,
          message: err?.message,
        });
        lastErr = err;
      }
    }

    if (!recorder) {
      console.error(`[recorder:${seq}] all MIME candidates failed`, lastErr);
      stopStream(stream);
      streamRef.current = null;
      setError({
        message: lastErr?.message || 'Could not create recorder',
        kind: 'recorder',
      });
      return;
    }

    console.log(`[recorder:${seq}] MediaRecorder created, mime="${chosenMime || '<default>'}"`);
    recorderRef.current = recorder;

    // ── Stage 4: ondataavailable / onstop ──────────────────
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onerror = (e: Event) => {
      console.error(`[recorder:${seq}] recorder error event`, e);
    };

    recorder.onstop = () => {
      console.log(`[recorder:${seq}] recorder stopped, chunks: ${chunksRef.current.length}`);
      const mimeToUse = recorder?.mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeToUse });

      setAudioBlob(blob);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
      setState('done');

      stopStream(streamRef.current);
      streamRef.current = null;
    };

    // ── Stage 5: recorder.start() ──────────────────────────
    try {
      recorder.start();
      console.log(`[recorder:${seq}] recorder.start() OK`);
      setState('recording');
    } catch (err: any) {
      console.error(`[recorder:${seq}] recorder.start() FAILED`, {
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
      });
      stopRecorder(recorder);
      stopStream(stream);
      streamRef.current = null;
      recorderRef.current = null;

      // Recorder start failure → could be audio source unavailable
      setError({
        message: err?.message || 'Could not start recording',
        kind: err?.name === 'NotReadableError' ? 'unavailable' : 'recorder',
      });
    }
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && state === 'recording') {
      stopRecorder(recorderRef.current);
    }
  }, [state]);

  const reset = useCallback(() => {
    stopRecorder(recorderRef.current);
    recorderRef.current = null;
    stopStream(streamRef.current);
    streamRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setState('idle');
    setError(null);
  }, []);

  const play = useCallback(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  }, [audioUrl]);

  return { state, audioBlob, audioUrl, error, start, stop, reset, play };
}
