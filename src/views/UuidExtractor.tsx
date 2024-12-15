import { ActionSection } from '@/components/ActionSection';
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
        <>
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

          {selectedField && (
            <Section>
              <Section.Title>Extraction Results</Section.Title>
              <Section.Description>
                {extractedUuids.length > 0
                  ? `Found ${extractedUuids.length} UUIDs`
                  : 'No UUIDs found in selected field'}
              </Section.Description>
              <Metadata />
            </Section>
          )}

          {extractedUuids.length > 0 && (
            <ActionSection>
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
            </ActionSection>
          )}
        </>
      )}
    </div>
  );
}

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
