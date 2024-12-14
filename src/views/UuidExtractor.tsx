import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Metadata } from '@/components/Metadata';
import { UuidDisplay } from '@/components/UuidDisplay';
import { UuidInput } from '@/components/UuidInput';
import { Separator } from '@/components/ui/separator';
import { getAllPaths, getValueByPath } from '@/lib/parse';
import { extractUuids } from '@/lib/uuid';
import { useWorkingFileStore } from '@/store/store';
import { useMemo, useState } from 'react';

export function UuidExtractor() {
  const {
    setFileName,
    setFileContent,
    resetFileState,
    fileName,
    fileType,
    fileContentParsed,
    fileContentRaw: input,
    setFileContentRaw: setInput
  } = useWorkingFileStore();

  const [selectedField, setSelectedField] = useState('');
  const [extractedUuids, setExtractedUuids] = useState<string[]>([]);

  // Dynamically generate fields based on parsed content
  const availableFields = useMemo(() => {
    if (fileContentParsed.length === 0) return [];
    return getAllPaths(fileContentParsed[0] || {});
  }, [fileContentParsed]);

  const handleFieldSelection = (field: string) => {
    setSelectedField(field);
    
    // Use consistent extraction method across file types
    const uuids = fileContentParsed
      .map(row => {
        const value = getValueByPath(row, field);
        return value ? extractUuids(value.toString()) : [];
      })
      .flat();

    setExtractedUuids(uuids);
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
            fields={availableFields}
            selectedField={selectedField}
            onFieldSelect={handleFieldSelection}
            placeholder={`Select ${fileType} field`}
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
