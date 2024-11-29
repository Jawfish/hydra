import { Button } from '@/components/ui/button';
import React from 'react';

interface FieldSelectorProps {
  fileType: 'csv' | 'jsonl' | null;
  fields: string[];
  selectedField: string;
  onFieldSelect: (field: string) => void;
}

export function FieldSelector({
  fileType,
  fields,
  selectedField,
  onFieldSelect
}: FieldSelectorProps) {
  if (fields.length === 0) return null;

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-medium'>
        Select {fileType === 'jsonl' ? 'field' : 'column'} containing UUIDs
      </h2>
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
    </div>
  );
}
