import { Button } from '@/shadcn/components/ui/button';
import type React from 'react';

interface ActionSectionProps {
  children: React.ReactNode;
  className?: string;
}

interface ActionSectionButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
}

export const ActionSection = ({ children }: ActionSectionProps) => (
  <div className='flex flex-col gap-6 bg-muted p-6 -m-6 mt-6 rounded-md'>
    {children}
  </div>
);

ActionSection.Button = ({
  children,
  onClick,
  variant = 'default',
  disabled = false
}: ActionSectionButtonProps) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    variant={variant}
    className='w-min min-w-fit'
  >
    {children}
  </Button>
);
