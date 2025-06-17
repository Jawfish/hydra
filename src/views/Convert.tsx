import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActionSection } from '@/components/ActionSection';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Section } from '@/components/Section';
import { useFileUpload } from '@/hooks/useFileUpload';
import { serializeJson } from '@/lib/parse';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shadcn/components/ui/select';
import { type FileType, useWorkingFileStore } from '@/store/store';

export function Convert(): React.JSX.Element {
  const { fileName, fileContentParsed } = useWorkingFileStore();
  const [selectedFormat, setSelectedFormat] = useState<FileType>('csv');

  const handleFileUpload = useFileUpload('working');

  const handleDownload = (): void => {
    if (fileContentParsed.length === 0) {
      toast.error('No file content to convert');
      return;
    }

    try {
      const output = serializeJson(fileContentParsed, selectedFormat);
      let mimeType = 'text/csv';

      if (selectedFormat === 'json') {
        mimeType = 'application/json';
      } else if (selectedFormat === 'jsonl') {
        mimeType = 'application/jsonl';
      }

      const blob = new Blob([output], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `converted_${timestamp}.${selectedFormat}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded file as ${selectedFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <div className='mb-12 flex flex-col gap-16'>
      <Header>
        <Header.Title>Convert File</Header.Title>
        <Header.Description>Convert your file to different formats</Header.Description>
      </Header>

      <Section>
        <Section.Title>Working File</Section.Title>
        <Section.Description>Upload a file to convert</Section.Description>
        <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />
      </Section>

      {fileName && fileContentParsed.length > 0 && (
        <>
          <Section>
            <Section.Title>Conversion Settings</Section.Title>
            <Section.Description>Select the target file format</Section.Description>
            <Section.Items>
              <div className='flex items-center space-x-4'>
                <span className='text-sm'>Convert to:</span>
                <Select
                  value={selectedFormat}
                  onValueChange={(value: string): void =>
                    setSelectedFormat(value as FileType)
                  }
                >
                  <SelectTrigger className='w-[100px]'>
                    <SelectValue placeholder='Format' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='csv'>CSV</SelectItem>
                    <SelectItem value='json'>JSON</SelectItem>
                    <SelectItem value='jsonl'>JSONL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Section.Items>
          </Section>

          <Section>
            <Section.Title>File Details</Section.Title>
            <Section.Description>Current file: {fileName}</Section.Description>
            <Section.Items>
              <p className='text-muted-foreground text-sm'>
                {fileContentParsed.length} rows loaded
              </p>
            </Section.Items>
          </Section>

          <ActionSection>
            <ActionSection.Button onClick={handleDownload}>
              Download Converted File
            </ActionSection.Button>
          </ActionSection>
        </>
      )}
    </div>
  );
}
