import { Button } from '@/components/ui/button';
import { useFileStore } from '@/store/store';
import React from 'react';

interface FileUploadProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const fileError = useFileStore(state => state.fileError);
  
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
      {fileError && (
        <p className='text-red-500 text-sm flex flex-col justify-center'>
          {fileError}
        </p>
      )}
    </div>
  );
}
