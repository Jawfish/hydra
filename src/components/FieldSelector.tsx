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
  placeholder?: string;
  disabled?: boolean;
}

export function FieldSelector({
  fields,
  selectedField,
  onFieldSelect,
  placeholder = 'Select field...',
  disabled = false
}: FieldSelectorProps) {
  // Only return null if there are NO fields
  if (fields.length === 0) {
    return null;
  }

  return (
    <Select value={selectedField} onValueChange={onFieldSelect} disabled={disabled}>
      <SelectTrigger className='w-full' disabled={disabled}>
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
  );
}
