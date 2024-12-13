import { Button } from '@/components/ui/button';
import type { FileType } from '@/store/store';
import type React from 'react';

type FileUploadProps = {
  onFileUpload: (fileName: string, fileContent: string, fileType: string) => void;
};

const getFileType = (file: File): FileType => {
  const mimeType = file.type;
  const extensionToType: Record<string, FileType> = {
    json: 'json',
    csv: 'csv',
    jsonl: 'jsonl'
  };

  switch (mimeType) {
    case 'application/json':
      return 'json';
    case 'text/csv':
      return 'csv';
    case 'application/jsonlines':
      return 'jsonl';
    default:
      return extensionToType[file.name.split('.').pop() || 'unknown'];
  }
};

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const content = await file.text();
      const fileType = getFileType(file);

      onFileUpload(file.name, content, fileType);
    }
  };

  return (
    <Button asChild={true} variant='secondary'>
      <label className='cursor-pointer'>
        Select File
        <input
          type='file'
          accept='.csv,.jsonl,.json'
          className='hidden'
          onChange={handleFileUpload}
        />
      </label>
    </Button>
  );
}

// {/* {fileName && (
//     <p className='text-sm text-muted-foreground'>
//       Selected file: <strong className='font-medium'>{fileName}</strong>
//     </p>
//   )} */}
