import { Button } from '@/shadcn/components/ui/button';
import type { FileType } from '@/store/store';
import type React from 'react';

type FileUploadProps = {
  onFileUpload: (fileName: string, fileContent: string, fileType: FileType) => void;
  fileName: string | null;
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

export function FileUpload({ onFileUpload, fileName }: FileUploadProps) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const content = await file.text();
      const fileType = getFileType(file);

      onFileUpload(file.name, content, fileType);
    }
  };

  // Truncate the file name if it's too long, but preserve the extension
  const truncateFileName = (name: string) => {
    const parts = name.split('.');
    const extension = parts[parts.length - 1];
    const nameOnly = parts[0];
    let truncatedName = nameOnly.slice(0, 20);

    if (nameOnly.length > 20) {
      truncatedName = `${truncatedName.slice(0, 17)}...`;
    }

    return `${truncatedName} (${extension})`;
  };

  return (
    <div className='flex gap-2 items-center'>
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
      {fileName && (
        <p className='text-sm text-muted-foreground'>
          <strong className='font-medium'>{truncateFileName(fileName)}</strong>
        </p>
      )}
    </div>
  );
}
