import { Button } from '@/shadcn/components/ui/button';
import type React from 'react';
import type { JSX } from 'react';

interface ActionSectionProps {
  children: React.ReactNode;
  className?: string;
}

interface ActionSectionButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive';
  onClick?: () => void;
  disabled?: boolean;
}

export const ActionSection = ({ children }: ActionSectionProps): JSX.Element => (
  <div className='-mx-6 flex items-center gap-6 rounded-md p-6'>{children}</div>
);

ActionSection.Button = ({
  children,
  onClick,
  variant = 'default',
  disabled = false
}: ActionSectionButtonProps): JSX.Element => (
  <Button
    onClick={onClick}
    disabled={disabled}
    variant={variant}
    className='w-min min-w-fit'
  >
    {children}
  </Button>
);
