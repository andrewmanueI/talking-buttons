import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  ready: boolean;
  minDuration?: number;
  onFinished: () => void;
}

const AppIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

type Phase = 'fade-in' | 'visible' | 'fade-out' | 'done';

export default function SplashScreen({ ready, minDuration = 1800, onFinished }: Props) {
  const [phase, setPhase] = useState<Phase>('fade-in');
  const mountTime = useRef(Date.now());
  const finishedRef = useRef(false);

  // Fade-in completes after 300ms
  useEffect(() => {
    const id = setTimeout(() => setPhase('visible'), 300);
    return () => clearTimeout(id);
  }, []);

  // Advance to fade-out when ready AND min duration elapsed
  useEffect(() => {
    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, minDuration - elapsed);

    const id = setTimeout(() => {
      if (ready) {
        setPhase('fade-out');
      }
    }, remaining);

    return () => clearTimeout(id);
  }, [ready, minDuration]);

  // When ready becomes true after min duration, trigger fade-out immediately
  useEffect(() => {
    if (ready && Date.now() - mountTime.current >= minDuration) {
      setPhase((prev) => (prev === 'visible' ? 'fade-out' : prev));
    }
  }, [ready, minDuration]);

  // After fade-out animation, call onFinished (with setTimeout fallback)
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

  if (phase === 'done') return null;

  return (
    <div
      className={`splash-screen${phase === 'fade-out' ? ' splash-exiting' : ''}`}
      onAnimationEnd={phase === 'fade-out' ? handleAnimationEnd : undefined}
    >
      <div className="splash-icon-wrap">
        <div className="splash-icon">
          <AppIcon />
        </div>
      </div>
      <h1 className="splash-title">Talking Buttons</h1>
      <div className="splash-dots">
        <span className="splash-dot" style={{ animationDelay: '0ms' }} />
        <span className="splash-dot" style={{ animationDelay: '150ms' }} />
        <span className="splash-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
