import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Metadata } from '@/components/Metadata';
import { UUIDDisplay } from '@/components/UUIDDisplay';
import { UUIDInput } from '@/components/UUIDInput';
import Header from '@/components/Header';
import { getAllPaths, parseJSONL } from '@/lib/jsonl';
import { extractUUIDs, extractUUIDsFromCSV, extractUUIDsFromJSONL } from '@/lib/uuid';
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
    selectedField,
    extractedUUIDs
  } = useFileStore();


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
    <div className='flex flex-col'>
      <Header>
        <Header.Title>Extract UUIDs</Header.Title>
        <Header.Description>
          Extract UUIDs from pasted text or uploaded CSV/JSONL files
        </Header.Description>
      </Header>
      <UUIDInput input={input} onChange={handleInputChange} />
      <FileUpload />
      {fileType && (
        <>
          <h3 className='font-semibold mt-12 mb-4'>
            Select {fileType === 'jsonl' ? 'field' : 'column'} to extract UUIDs from
          </h3>
          <FieldSelector
            fields={fileType === 'jsonl' ? jsonlSchema : csvHeaders}
            selectedField={selectedField}
            onFieldSelect={handleFieldSelection}
          />
        </>
      )}
      {extractedUUIDs.length > 0 && (
        <>
          <h3 className='font-semibold mt-12'>Extraction results</h3>
          <Metadata />
        </>
      )}
      <UUIDDisplay />
    </div>
  );
}
