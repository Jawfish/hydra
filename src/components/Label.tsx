import type { JSX, ReactNode } from 'react';

type LabelProps = {
  htmlFor: string;
  children: ReactNode;
  className?: string;
};

export function Label({ htmlFor, children, className = '' }: LabelProps): JSX.Element {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-2 block text-muted-foreground text-sm ${className}`}
    >
      {children}
    </label>
  );
}
