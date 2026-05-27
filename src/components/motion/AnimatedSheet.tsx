import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  open: boolean;
}

export default function AnimatedSheet({ children, open }: Props) {
  if (!open) return null;

  return (
    <div className="sheet-transition">
      {children}
    </div>
  );
}
