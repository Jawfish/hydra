import { Button } from '@/components/ui/button';
import { useFileStore } from '@/store/store';
import React from 'react';

interface FileUploadProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function FileUpload({ onUpload, className }: FileUploadProps) {
  const { fileError } = useFileStore();

  return (
    <div className={className}>
      <Button asChild variant='secondary'>
        <label className='cursor-pointer'>
          Select CSV/JSONL
          <input
            type='file'
            accept='.csv,.jsonl'
            className='hidden'
            onChange={onUpload}
          />
        </label>
      </Button>
      {fileError && (
        <p className='text-red-500 text-sm flex flex-col justify-center'>{fileError}</p>
      )}
    </div>
  );
}
