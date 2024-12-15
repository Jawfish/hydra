import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shadcn/components/ui/select';
import { Section } from './Section';

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
    <Section>
      <Section.Title>Input Field</Section.Title>
      <Section.Items>
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
      </Section.Items>
    </Section>
  );
}
