import { Button } from '@/components/ui/button';
import { getAllPaths, parseJsonl } from '@/lib/jsonl';
import { useFileStore } from '@/store/store';
import type React from 'react';

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
    if (!file) {
      return;
    }

    try {
      let content = await file.text();
      const type = file.name.toLowerCase().endsWith('.csv')
        ? 'csv'
        : file.name.toLowerCase().endsWith('.jsonl')
          ? 'jsonl'
          : null;

      if (!type) {
        setFileError('Please upload a .csv or .jsonl file');
        return;
      }

      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      setFileType(type);
      setFileContent(content);
      setFileName(file.name);

      if (type === 'jsonl') {
        const parsedObjects = parseJsonl(content);
        if (parsedObjects.length === 0) {
          setFileError('No valid JSONL data found in file');
          return;
        }
        const paths = getAllPaths(parsedObjects[0]);
        if (paths.length > 0) {
          setJsonlSchema(paths);
        } else {
          setFileError('No valid fields found in JSONL data');
        }
      } else {
        const firstLine = content.split('\n')[0];
        if (firstLine) {
          setCsvHeaders(firstLine.split(',').map(header => header.trim()));
        }
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
