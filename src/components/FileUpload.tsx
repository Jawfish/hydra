import { Button } from '@/components/ui/button';
import React from 'react';

interface FileUploadProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
}

export function FileUpload({ onUpload, error }: FileUploadProps) {
  return (
    <div className='flex gap-6'>
      <Button asChild variant='secondary'>
        <label className='cursor-pointer'>
          Upload CSV/JSONL
          <input
            type='file'
            accept='.csv,.jsonl'
            className='hidden'
            onChange={onUpload}
          />
        </label>
      </Button>
      {error && (
        <p className='text-red-500 text-sm flex flex-col justify-center'>{error}</p>
      )}
    </div>
  );
}
