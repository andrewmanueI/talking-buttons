import type { ReactNode, CSSProperties } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

export default function GlassPanel({ children, className = '', style, onClick }: Props) {
  return (
    <div className={`glass-panel ${className}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
