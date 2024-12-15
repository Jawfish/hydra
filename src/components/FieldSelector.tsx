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
  labelText: string;
  placeholder?: string;
  disabled?: boolean;
}

export function FieldSelector({
  fields,
  selectedField,
  onFieldSelect,
  labelText,
  placeholder = 'Select field',
  disabled = false
}: FieldSelectorProps): JSX.Element | null {
  // Only return null if there are NO fields
  if (fields.length === 0) {
    return null;
  }

  return (
    <div>
      <label
        htmlFor={labelText.toLowerCase().replace(/[^a-z-]/g, '')}
        className='mb-2 block font-medium text-sm'
      >
        {labelText}
      </label>
      <Select value={selectedField} onValueChange={onFieldSelect} disabled={disabled}>
        <SelectTrigger disabled={disabled}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {fields.map(field => (
            <SelectItem key={field} value={field}>
              {field}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
