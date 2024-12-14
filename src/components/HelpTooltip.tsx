import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/shadcn/components/ui/tooltip';

interface HelpTooltipProps {
  message: string;
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  message, 
  className = 'w-3 h-3 text-muted-foreground' 
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <HelpCircle className={className} />
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
