import { Label } from '@/components/Label';
import type { JSX } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shadcn/components/ui/select';
interface FieldSelectorProps {
  fields: string[];
  selectedField: string;
  onFieldSelect: (field: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FieldSelector({
  fields,
  selectedField,
  onFieldSelect,
  label,
  placeholder = 'Select field',
  disabled = false,
  className
}: FieldSelectorProps): JSX.Element | null {
  // Only return null if there are NO fields
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={label.toLowerCase().replace(/[^a-z-]/g, '')}>{label}</Label>
      )}
      <Select value={selectedField} onValueChange={onFieldSelect} disabled={disabled}>
        <SelectTrigger className='w-full min-w-0 truncate' disabled={disabled}>
          <SelectValue placeholder={placeholder} className='truncate' />
        </SelectTrigger>
        <SelectContent>
          {fields.map(field => (
            <SelectItem key={field} value={field} className='w-full truncate'>
              {field}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
