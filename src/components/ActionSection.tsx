import { Button } from '@/shadcn/components/ui/button';
import { Progress } from '@/shadcn/components/ui/progress';
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

interface ActionSectionProgressProps {
  value: number;
}

export const ActionSection = ({ children }: ActionSectionProps) => (
  <div className='flex flex-col gap-6 bg-muted p-6 -m-6 mt-6 rounded-md'>
    <div className='flex items-center justify-between'>
      {children}
    </div>
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
  <div className='flex flex-col gap-2'>
    <Progress value={value} />
    <p className='text-sm text-muted-foreground text-center'>
      {value}% complete
    </p>
  </div>
);
