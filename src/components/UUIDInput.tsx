import { Textarea } from '@/components/ui/textarea';
import React from 'react';

interface UUIDInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function UUIDInput({ input, onChange }: UUIDInputProps) {
  return (
    <div className='flex flex-col gap-6'>
      <label htmlFor='uuidInput' className='block text-lg font-medium'>
        Enter text containing UUIDs
      </label>
      <Textarea
        id='uuidInput'
        rows={6}
        value={input}
        onChange={onChange}
        placeholder='Paste your text here...'
      />
    </div>
  );
}
