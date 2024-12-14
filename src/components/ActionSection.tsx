import { Button } from '@/shadcn/components/ui/button';
import { Progress } from '@/shadcn/components/ui/progress';
import type React from 'react';

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

interface ActionSectionProgressProps {
  value: number;
}

export const ActionSection = ({ children }: ActionSectionProps) => (
  <div className='-m-6 mt-6 flex items-center gap-6 rounded-md bg-muted p-6'>
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

ActionSection.Progress = ({ value }: ActionSectionProgressProps) => (
  <Progress value={value} />
);
