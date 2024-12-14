import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Metadata } from '@/components/Metadata';
import { UuidDisplay } from '@/components/UuidDisplay';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getAllPaths, getValueByPath } from '@/lib/parse';
import { extractUuids } from '@/lib/uuid';
import { Separator } from '@/shadcn/components/ui/separator';
import { useWorkingFileStore } from '@/store/store';
import { useMemo, useState } from 'react';

export function UuidExtractor() {
  const { fileName, fileContentParsed } = useWorkingFileStore();

  const [selectedField, setSelectedField] = useState('');
  const [extractedUuids, setExtractedUuids] = useState<string[]>([]);

  const availableFields = useMemo(() => {
    if (fileContentParsed.length === 0) {
      return [];
    }
    return getAllPaths(fileContentParsed[0] || {});
  }, [fileContentParsed]);

  const handleFileUpload = useFileUpload('working');

  const handleFieldSelection = (field: string) => {
    setSelectedField(field);

    const uuids = fileContentParsed.flatMap(row => {
      const value = getValueByPath(row, field);
      return value ? extractUuids(value.toString()) : [];
    });

    setExtractedUuids(uuids);
  };

  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>Extract UUIDs</Header.Title>
        <Header.Description>Extract UUIDs from an uploaded file</Header.Description>
      </Header>

      <div className='mb-4'>
        <h3 className='text-lg font-semibold'>Working File</h3>
        <p className='text-muted-foreground text-sm'>The file to extract UUIDs from</p>
      </div>
      <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />
      {fileContentParsed.length > 0 && (
        <>
          <h3 className='font-semibold mb-4 mt-10'>
            Select field to extract UUIDs from
          </h3>
          <FieldSelector
            fields={availableFields}
            selectedField={selectedField}
            onFieldSelect={handleFieldSelection}
            placeholder='Select field'
          />
        </>
      )}
      {extractedUuids.length > 0 && (
        <>
          <Separator className='my-14 h-[1px]' />
          <h3 className='font-semibold'>Extraction results</h3>
          <Metadata />
          <UuidDisplay extractedUuids={extractedUuids} />
        </>
      )}
      {fileContentParsed.length > 0 && selectedField && extractedUuids.length === 0 && (
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
