import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/shadcn/components/ui/tooltip';
import { cn } from '@/shadcn/lib/utils';

interface HelpTooltipProps {
  message: string;
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ message, className }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <HelpCircle className={cn(['h-4 w-4 text-muted-foreground', className])} />
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
