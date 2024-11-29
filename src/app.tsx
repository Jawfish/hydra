import { FieldSelector } from '@/components/FieldSelector';
import { FileMetadata } from '@/components/FileMetadata';
import { FileUpload } from '@/components/FileUpload';
import { ThemeProvider } from '@/components/ThemeProvider';
import { UUIDDisplay } from '@/components/UUIDDisplay';
import { UUIDInput } from '@/components/UUIDInput';
import { Toaster } from '@/components/ui/toaster';
import { getAllPaths } from '@/lib/jsonl';
import { parseJSONL } from '@/lib/jsonl';
import { extractUUIDs, extractUUIDsFromCSV, extractUUIDsFromJSONL } from '@/lib/uuid';
import { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [extractedUUIDs, setExtractedUUIDs] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [jsonlSchema, setJsonlSchema] = useState<string[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'jsonl' | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput('');
    setExtractedUUIDs([]);
    setFileError(null);
    setJsonlSchema([]);
    setCsvHeaders([]);
    setSelectedField('');
    setFileContent('');
    setFileType(null);

    const file = e.target.files?.[0];
    if (!file) return;

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

      if (type === 'jsonl') {
        const parsedObjects = parseJSONL(content);
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

  const handleFieldSelection = (field: string) => {
    setSelectedField(field);
    if (fileType === 'jsonl') {
      const uuids = extractUUIDsFromJSONL(fileContent, field);
      setExtractedUUIDs(uuids);
    } else if (fileType === 'csv') {
      const uuids = extractUUIDsFromCSV(fileContent, field);
      setExtractedUUIDs(uuids);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInput(newText);
    setExtractedUUIDs(extractUUIDs(newText));

    if (fileType) {
      setFileType(null);
      setFileContent('');
      setJsonlSchema([]);
      setCsvHeaders([]);
      setSelectedField('');
      setFileError(null);
    }
  };

  return (
    <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
      <div className='flex min-h-screen flex-col items-center p-8'>
        <div className='w-full max-w-4xl flex flex-col gap-6'>
          <UUIDInput input={input} onChange={handleInputChange} />
          <FileUpload onUpload={handleFileUpload} error={fileError} />
          <FieldSelector
            fileType={fileType}
            fields={fileType === 'jsonl' ? jsonlSchema : csvHeaders}
            selectedField={selectedField}
            onFieldSelect={handleFieldSelection}
          />
          <FileMetadata fileType={fileType} fileContent={fileContent} />
          <UUIDDisplay uuids={extractedUUIDs} />
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
