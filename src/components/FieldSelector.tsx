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
}

export function FieldSelector({
  fields,
  selectedField,
  onFieldSelect,
  label,
  placeholder = 'Select field',
  disabled = false
}: FieldSelectorProps): JSX.Element | null {
  // Only return null if there are NO fields
  if (fields.length === 0) {
    return null;
  }

  return (
    <div>
      {label && (
        <Label htmlFor={label.toLowerCase().replace(/[^a-z-]/g, '')}>{label}</Label>
      )}
      <Select value={selectedField} onValueChange={onFieldSelect} disabled={disabled}>
        <SelectTrigger className="w-48 truncate" disabled={disabled}>
          <SelectValue placeholder={placeholder} className="truncate overflow-hidden" />
        </SelectTrigger>
        <SelectContent>
          {fields.map(field => (
            <SelectItem key={field} value={field} className="max-w-48 truncate">
              {field}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
