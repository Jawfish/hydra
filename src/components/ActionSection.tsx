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

interface ActionSectionContainerProps {
  children: React.ReactNode;
}

interface ActionSectionProgressProps {
  value: number;
}

export const ActionSection = ({ children }: ActionSectionProps) => (
  <div className='flex flex-col gap-6 bg-muted p-6 -m-6 mt-6 rounded-md'>
    {children}
  </div>
);

ActionSection.Container = ({ children }: ActionSectionContainerProps) => (
  <div className='flex gap-4'>{children}</div>
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
    <p className='text-sm text-muted-foreground text-center'>{value}% complete</p>
  </div>
);
