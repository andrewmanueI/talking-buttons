import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

export default function IconButton({ children, label, onClick, variant = 'default' }: Props) {
  return (
    <button
      className={`icon-btn-icon ${variant === 'primary' ? 'icon-btn-primary' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  );
}
