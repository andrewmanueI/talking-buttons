import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Changing key triggers re-animation. Defaults to a stable value so it only animates on mount. */
  screenKey?: string;
}

export default function AnimatedScreen({ children, screenKey }: Props) {
  return (
    <div className="screen-transition" key={screenKey}>
      {children}
    </div>
  );
}
