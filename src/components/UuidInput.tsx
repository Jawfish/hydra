import { Textarea } from '@/components/ui/textarea';
import type React from 'react';

interface UuidInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

export function UuidInput({ input, onChange, className }: UuidInputProps) {
  return (
    <div className={`flex flex-col gap-6 ${className}`}>
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
