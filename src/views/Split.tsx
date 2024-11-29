import { ActionSection } from '@/components/ActionSection';
import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Section } from '@/components/Section';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getAllPaths, serializeJson } from '@/lib/parse';
import { type FileType, useWorkingFileStore } from '@/store/store';
import jsZip from 'jszip';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { toast } from 'sonner';

export function Split(): JSX.Element {
  const { fileName: workingFileName, fileContentParsed: workingFileContent } =
    useWorkingFileStore();
  const [workingFileSchema, setWorkingFileSchema] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');

  const handleWorkingFileUpload = useFileUpload('working');

  useEffect(() => {
    if (workingFileContent.length > 0) {
      const schema = getAllPaths(workingFileContent[0] || {});
      setWorkingFileSchema(schema);
    }
  }, [workingFileContent]);

  const groupRecordsByField = (
    records: Record<string, unknown>[],
    field: string
  ): Record<string, Record<string, unknown>[]> => {
    const splitGroups: Record<string, Record<string, unknown>[]> = {};

    for (const record of records) {
      const fieldValue = record[field] ?? 'undefined';
      const key = String(fieldValue);

      if (!splitGroups[key]) {
        splitGroups[key] = [];
      }
      splitGroups[key].push(record);
    }

    return splitGroups;
  };

  const createZipFromGroups = async (
    splitGroups: Record<string, Record<string, unknown>[]>,
    selectedField: string,
    fileType: FileType
  ): Promise<Blob> => {
    const zip = new jsZip();

    for (const [key, groupRecords] of Object.entries(splitGroups)) {
      const sanitizedKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${selectedField}_${sanitizedKey}.${fileType}`;
      const fileContent = serializeJson(groupRecords, fileType);
      zip.file(filename, fileContent);
    }

    return await zip.generateAsync({ type: 'blob' });
  };

  const downloadZipFile = (zipBlob: Blob, selectedField: string): void => {
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `split_${selectedField}_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processSplit = async (): Promise<void> => {
    if (!workingFileName) {
      toast.error('Please upload a file to split');
      return;
    }

    if (!selectedField) {
      toast.error('Please select a field to split by');
      return;
    }

    try {
      // Group records by selected field
      const splitGroups = groupRecordsByField(workingFileContent, selectedField);

      // Determine file type from original file
      const fileType = (workingFileName?.split('.').pop() || 'csv') as FileType;

      // Create zip file
      const zipBlob = await createZipFromGroups(splitGroups, selectedField, fileType);

      // Download zip file
      downloadZipFile(zipBlob, selectedField);

      toast.success(`Split into ${Object.keys(splitGroups).length} files`);
    } catch (error) {
      console.error('Split Error:', error);
      toast.error(
        `Error splitting file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='mb-12 flex flex-col gap-16'>
      <Header>
        <Header.Title>Split</Header.Title>
        <Header.Description>
          Split records into separate files based on a field's value
        </Header.Description>
      </Header>

      <Section>
        <Section.Title>Working File</Section.Title>
        <Section.Description>The file to split</Section.Description>
        <FileUpload onFileUpload={handleWorkingFileUpload} fileName={workingFileName} />
      </Section>

      {workingFileName && (
        <>
          <Section>
            <Section.Title>Split Field</Section.Title>
            <Section.Description>
              Select the field to split records by
            </Section.Description>
            <FieldSelector
              fields={workingFileSchema}
              selectedField={selectedField}
              onFieldSelect={setSelectedField}
              placeholder='Select field to split by'
            />
          </Section>

          <ActionSection>
            <ActionSection.Button onClick={processSplit} disabled={!selectedField}>
              Split File
            </ActionSection.Button>
          </ActionSection>
        </>
      )}
    </div>
  );
}
