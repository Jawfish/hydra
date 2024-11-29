import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Metadata } from '@/components/Metadata';
import { UUIDDisplay } from '@/components/UUIDDisplay';
import { UUIDInput } from '@/components/UUIDInput';
import { extractUUIDs, extractUUIDsFromCSV, extractUUIDsFromJSONL } from '@/lib/uuid';
import { getAllPaths, parseJSONL } from '@/lib/jsonl';
import { useFileStore } from '@/store/store';

export function UUIDExtractor() {
  const {
    setInput,
    setExtractedUUIDs,
    setFileError,
    setJsonlSchema,
    setCsvHeaders,
    setSelectedField,
    setFileContent,
    setFileType,
    resetFileState,
    input,
    fileType,
    jsonlSchema,
    csvHeaders,
    selectedField
  } = useFileStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    resetFileState();

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
      const uuids = extractUUIDsFromJSONL(useFileStore.getState().fileContent, field);
      setExtractedUUIDs(uuids);
    } else if (fileType === 'csv') {
      const uuids = extractUUIDsFromCSV(useFileStore.getState().fileContent, field);
      setExtractedUUIDs(uuids);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInput(newText);
    setExtractedUUIDs(extractUUIDs(newText));

    if (fileType) {
      resetFileState();
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <UUIDInput input={input} onChange={handleInputChange} />
      <FileUpload onUpload={handleFileUpload} />
      <FieldSelector
        fileType={fileType}
        fields={fileType === 'jsonl' ? jsonlSchema : csvHeaders}
        selectedField={selectedField}
        onFieldSelect={handleFieldSelection}
      />
      <Metadata />
      <UUIDDisplay />
    </div>
  );
}
