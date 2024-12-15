import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Metadata } from '@/components/Metadata';
import { Section } from '@/components/Section';
import { UuidDisplay } from '@/components/UuidDisplay';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getAllPaths, getValueByPath } from '@/lib/parse';
import { extractUuids } from '@/lib/uuid';
import { useWorkingFileStore } from '@/store/store';
import { useMemo, useState } from 'react';
import type { JSX } from 'react';

export function UuidExtractor(): JSX.Element {
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

  const handleFieldSelection = (field: string): void => {
    setSelectedField(field);

    const uuids = fileContentParsed.flatMap(row => {
      const value = getValueByPath(row, field);
      return value ? extractUuids(value.toString()) : [];
    });

    setExtractedUuids(uuids);
  };

  return (
    <div className='mb-12 flex flex-col gap-16'>
      <Header>
        <Header.Title>Extract UUIDs</Header.Title>
        <Header.Description>Extract UUIDs from an uploaded file</Header.Description>
      </Header>

      <Section>
        <Section.Title>Working File</Section.Title>
        <Section.Description>The file to extract UUIDs from</Section.Description>
        <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />
      </Section>

      {fileContentParsed.length > 0 && (
        <Section>
          <Section.Title>Field Selection</Section.Title>
          <Section.Description>
            Select the field to extract UUIDs from
          </Section.Description>
          <Section.Items>
            <FieldSelector
              fields={availableFields}
              selectedField={selectedField}
              onFieldSelect={handleFieldSelection}
              placeholder='Select field'
            />
          </Section.Items>
        </Section>
      )}

      {extractedUuids.length > 0 && (
        <Section>
          <Section.Title>Extraction Results</Section.Title>
          <Metadata />
          <UuidDisplay extractedUuids={extractedUuids} />
        </Section>
      )}

      {fileContentParsed.length > 0 && selectedField && extractedUuids.length === 0 && (
        <div className='text-muted-foreground'>
          <p>No UUIDs found</p>
        </div>
      )}
    </div>
  );
}
