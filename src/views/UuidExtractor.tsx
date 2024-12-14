import React, { useState, useMemo } from 'react';
import { useWorkingFileStore } from '@/store/store';
import { getAllPaths, getValueByPath } from '@/lib/parse';
import { extractUuids } from '@/lib/uuid';
import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Metadata } from '@/components/Metadata';
import { UuidDisplay } from '@/components/UuidDisplay';
import { UuidInput } from '@/components/UuidInput';
import { Separator } from '@/components/ui/separator';
import { useFileUpload } from '@/hooks/use-file-upload';

export function UuidExtractor() {
  const {
    fileName,
    fileContentRaw,
    fileContentParsed,
    setFileContent,
    resetFileState
  } = useWorkingFileStore();

  const [selectedField, setSelectedField] = useState('');
  const [extractedUuids, setExtractedUuids] = useState<string[]>([]);

  // Dynamically generate fields based on parsed content
  const availableFields = useMemo(() => {
    if (fileContentParsed.length === 0) return [];
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setFileContent(newText, 'unknown');
    setExtractedUuids(extractUuids(newText));
    resetFileState();
  };

  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>Extract UUIDs</Header.Title>
        <Header.Description>
          Extract UUIDs from pasted text or uploaded CSV or JSONL files
        </Header.Description>
      </Header>
      <UuidInput input={fileContentRaw} onChange={handleInputChange} className='mb-4 mt-10' />
      <FileUpload 
        onFileUpload={handleFileUpload}
        fileName={fileName}
      />
      {fileContentParsed.length > 0 && (
        <>
          <Separator className='my-14 h-[1px]' />
          <h3 className='font-semibold mb-4'>
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
          <UuidDisplay />
        </>
      )}
      {(fileContentParsed.length > 0 && selectedField) && extractedUuids.length === 0 && (
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
