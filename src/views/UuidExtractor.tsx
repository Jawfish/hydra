import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Metadata } from '@/components/Metadata';
import { UuidDisplay } from '@/components/UuidDisplay';
import { UuidInput } from '@/components/UuidInput';
import { Separator } from '@/components/ui/separator';
import { extractUuids, extractUuidsFromCsv, extractUuidsFromJsonl } from '@/lib/uuid';
import { useFileStore } from '@/store/store';

export function UuidExtractor() {
  const {
    setInput,
    setExtractedUuids,
    setSelectedField,
    resetFileState,
    input,
    fileType,
    jsonlSchema,
    csvHeaders,
    selectedField,
    extractedUuids
  } = useFileStore();

  const handleFieldSelection = (field: string) => {
    setSelectedField(field);
    if (fileType === 'jsonl') {
      const uuids = extractUuidsFromJsonl(useFileStore.getState().fileContent, field);
      setExtractedUuids(uuids);
    } else if (fileType === 'csv') {
      const uuids = extractUuidsFromCsv(useFileStore.getState().fileContent, field);
      setExtractedUuids(uuids);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInput(newText);
    setExtractedUuids(extractUuids(newText));

    if (fileType) {
      resetFileState();
    }
  };

  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>Extract UUIDs</Header.Title>
        <Header.Description>
          Extract UUIDs from pasted text or uploaded CSV or JSONL files
        </Header.Description>
      </Header>
      <UuidInput input={input} onChange={handleInputChange} className='mb-4 mt-10' />
      <FileUpload />
      {fileType && (
        <>
          <Separator className='my-14 h-[1px]' />
          <h3 className='font-semibold mb-4'>
            Select {fileType === 'jsonl' ? 'field' : 'column'} to extract UUIDs from
          </h3>
          <FieldSelector
            fields={fileType === 'jsonl' ? jsonlSchema : csvHeaders}
            selectedField={selectedField}
            onFieldSelect={handleFieldSelection}
          />
        </>
      )}
      {extractedUuids.length > 0 && (
        <>
          <Separator className='my-14 h-[1px]' />
          <h3 className='font-semibold'>Extraction results</h3>
          <Metadata />
          <UuidDisplay />
        </>
      )}
      {((fileType && selectedField) || input) && extractedUuids.length === 0 && (
        <>
          <Separator className='my-14 h-[1px]' />
          <div className='text-muted-foreground'>
            <p>No UUIDs found</p>
          </div>
        </>
      )}
    </div>
  );
}
