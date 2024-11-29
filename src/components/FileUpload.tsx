import { Button } from '@/components/ui/button';
import { getAllPaths, parseJsonl } from '@/lib/jsonl';
import { useFileStore } from '@/store/store';
import type React from 'react';

const determineFileType = (fileName: string): 'csv' | 'jsonl' | null => {
  if (fileName.toLowerCase().endsWith('.csv')) return 'csv';
  if (fileName.toLowerCase().endsWith('.jsonl')) return 'jsonl';
  return null;
};

const processJsonlContent = (
  content: string,
  setJsonlSchema: (schema: string[]) => void,
  setFileError: (error: string | null) => void
) => {
  const parsedObjects = parseJsonl(content);
  if (parsedObjects.length === 0) {
    setFileError('No valid JSONL data found in file');
    return false;
  }
  
  const paths = getAllPaths(parsedObjects[0]);
  if (paths.length === 0) {
    setFileError('No valid fields found in JSONL data');
    return false;
  }
  
  setJsonlSchema(paths);
  return true;
};

const processCsvContent = (
  content: string,
  setCsvHeaders: (headers: string[]) => void
) => {
  const firstLine = content.split('\n')[0];
  if (firstLine) {
    setCsvHeaders(firstLine.split(',').map(header => header.trim()));
  }
};

export function FileUpload() {
  const {
    fileError,
    fileName,
    setFileError,
    setJsonlSchema,
    setCsvHeaders,
    setFileContent,
    setFileType,
    setFileName,
    resetFileState
  } = useFileStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    resetFileState();

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileType = determineFileType(file.name);
      if (!fileType) {
        setFileError('Please upload a .csv or .jsonl file');
        return;
      }

      const content = (await file.text())
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

      setFileType(fileType);
      setFileContent(content);
      setFileName(file.name);

      if (fileType === 'jsonl') {
        const success = processJsonlContent(content, setJsonlSchema, setFileError);
        if (!success) return;
      } else {
        processCsvContent(content, setCsvHeaders);
      }
    } catch (error) {
      setFileError(
        `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className='space-y-2 flex gap-4'>
      <Button asChild={true} variant='secondary'>
        <label className='cursor-pointer'>
          Select CSV/JSONL
          <input
            type='file'
            accept='.csv,.jsonl'
            className='hidden'
            onChange={handleFileUpload}
          />
        </label>
      </Button>

      {fileName && (
        <p className='text-sm text-muted-foreground'>Selected file: {fileName}</p>
      )}

      {fileError && <p className='text-sm text-destructive'>{fileError}</p>}
    </div>
  );
}
