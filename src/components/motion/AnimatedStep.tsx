import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  stepKey: string;
}

export default function AnimatedStep({ children, stepKey }: Props) {
  return (
    <div className="step-transition" key={stepKey}>
      {children}
    </div>
  );
}
