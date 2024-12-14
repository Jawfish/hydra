import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface FieldSelectorProps {
  fields: string[];
  selectedField: string;
  onFieldSelect: (field: string) => void;
  placeholder?: string;
}

export function FieldSelector({
  fields,
  selectedField,
  onFieldSelect,
  placeholder = 'Select field...'
}: FieldSelectorProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <Select value={selectedField} onValueChange={onFieldSelect}>
      <SelectTrigger className='w-[200px]'>
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
