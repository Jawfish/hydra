import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Section } from '@/components/Section';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getAllPaths, getValueByPath } from '@/lib/parse';
import { extractUuids } from '@/lib/uuid';
import { useWorkingFileStore } from '@/store/store';
import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { toast } from 'sonner';
import { ActionSection } from '@/components/ActionSection';

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
        <Section className="mb-16">
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

interface UuidDisplayProps {
  extractedUuids: string[];
}

const UuidDisplay = ({ extractedUuids }: UuidDisplayProps): JSX.Element => {
  const handleCopy = (listType: 'python' | 'plaintext'): void => {
    if (extractedUuids.length === 0) {
      toast.warning('No UUIDs to copy');
      return;
    }

    try {
      if (listType === 'python') {
        navigator.clipboard.writeText(
          `[${extractedUuids.map(uuid => `'${uuid}'`).join(', ')}]`
        );
      } else {
        navigator.clipboard.writeText(extractedUuids.join('\n'));
      }

      toast.success(`Copied ${extractedUuids.length} UUIDs to clipboard`);
    } catch (error) {
      toast.error(
        `Error copying to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <ActionSection>
      {extractedUuids.length > 0 && (
        <div className='flex gap-2'>
          <ActionSection.Button onClick={(): void => handleCopy('python')}>
            Copy as Python list
          </ActionSection.Button>
          <ActionSection.Button
            onClick={(): void => handleCopy('plaintext')}
            variant='outline'
          >
            Copy as plain text
          </ActionSection.Button>
        </div>
      )}
    </ActionSection>
  );
};

const Metadata = (): JSX.Element => {
  const { fileContentParsed, fileName } = useWorkingFileStore();

  return (
    <>
      {fileName && (
        <p className='mt-2 text-muted-foreground text-sm'>
          {fileName.endsWith('.csv')
            ? `CSV file contains ${fileContentParsed.length} data rows`
            : `File contains ${fileContentParsed.length} objects`}
        </p>
      )}
    </>
  );
};
