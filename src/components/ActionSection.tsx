import type React from 'react';
import { cn } from '@/shadcn/lib/utils';

interface ActionSectionProps {
  children: React.ReactNode;
  className?: string;
}

interface ActionSectionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ActionSection = ({ children, className }: ActionSectionProps) => (
  <div className={cn('flex flex-col gap-6 bg-muted p-6 -m-6 mt-6 rounded-md', className)}>
    {children}
  </div>
);

ActionSection.Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  className 
}: ActionSectionButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'w-min rounded-md bg-primary text-primary-foreground hover:bg-primary/90 ' +
      'px-4 py-2 text-sm font-medium transition-colors ' +
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ' +
      'disabled:pointer-events-none disabled:opacity-50',
      className
    )}
  >
    {children}
  </button>
);
