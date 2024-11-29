import { Button } from '@/components/ui/button';

interface FieldSelectorProps {
  fields: string[];
  selectedField: string;
  onFieldSelect: (field: string) => void;
}

export function FieldSelector({
  fields,
  selectedField,
  onFieldSelect
}: FieldSelectorProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {fields.map(field => (
        <Button
          key={field}
          variant={selectedField === field ? 'default' : 'outline'}
          onClick={() => onFieldSelect(field)}
        >
          {field}
        </Button>
      ))}
    </div>
  );
}
