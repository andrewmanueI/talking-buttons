import { useEffect, useRef, useState } from 'react';
import GlassPanel from './GlassPanel';

interface Props {
  message: string;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: Props) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, 2500);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  return (
    <div className={`toast-overlay${exiting ? ' toast-exiting' : ''}`} onClick={onDismiss}>
      <GlassPanel className="toast-body">
        {message}
      </GlassPanel>
    </div>
  );
}
