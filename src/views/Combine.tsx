import { ActionSection } from '@/components/ActionSection';
import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Section } from '@/components/Section';
import { type FileInfo, combineFiles } from '@/lib/combine';
import { getParsedContentFromFile, serializeJson } from '@/lib/parse';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';
import type { FileType } from '@/store/store';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { JSX } from 'react';
import { toast } from 'sonner';

export function Combine(): JSX.Element {
  const [files, setFiles] = useState<FileInfo[]>([
    { id: crypto.randomUUID(), fileName: null, content: [], idField: '' }
  ]);

  const handleFileUpload = (
    index: number,
    fileName: string,
    fileContent: string,
    fileType: FileType
  ): void => {
    try {
      const parsedContent = getParsedContentFromFile(fileContent, fileType);
      setFiles(prev =>
        prev.map((file, i) =>
          i === index ? { ...file, fileName, content: parsedContent } : file
        )
      );
    } catch (error) {
      console.error('File Upload Error:', error);
      toast.error(
        `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const addFile = (): void => {
    setFiles(prev => [
      ...prev,
      { id: crypto.randomUUID(), fileName: null, content: [], idField: '' }
    ]);
  };

  const updateFileInfo = (index: number, updates: Partial<FileInfo>): void => {
    setFiles(prev =>
      prev.map((file, i) => (i === index ? { ...file, ...updates } : file))
    );
  };

  const processCombine = (): void => {
    try {
      const { combined, warnings } = combineFiles(files);

      // Show warnings if any
      for (const warning of warnings) {
        toast.warning(warning);
      }

      // Download the combined file
      const fileType = (files[0].fileName?.split('.').pop() as FileType) || 'jsonl';
      const serialized = serializeJson(combined, fileType);
      const blob = new Blob([serialized], {
        type: fileType === 'csv' ? 'text/csv' : 'application/json'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `combined_${timestamp}.${fileType}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Files combined successfully');
    } catch (error) {
      console.error('Combine Error:', error);
      toast.error(
        `Error combining files: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='mb-12 flex flex-col gap-16'>
      <Header>
        <Header.Title>Combine Files</Header.Title>
        <Header.Description>
          Combine files based on a common ID field. Fields with the same name can be
          given a prefix per-file
        </Header.Description>
      </Header>

      <Section>
        <Section.Title>Files to Combine</Section.Title>
        <Section.Description>
          Add files, select which ID to use to check for matches, and add a prefix for
          fields with the same name but different values
        </Section.Description>
        <Section.Items>
          {files.map((file, index) => (
            <div key={file.id} className='relative flex flex-col gap-4'>
              <div className='grid grid-cols-[2fr_1fr_1fr] gap-4'>
                <FileUpload
                  onFileUpload={(
                    name: string,
                    content: string,
                    fileType: FileType
                  ): void => handleFileUpload(index, name, content, fileType)}
                  fileName={file.fileName}
                />
                {file.content.length > 0 && (
                  <FieldSelector
                    fields={Object.keys(file.content[0])}
                    selectedField={file.idField}
                    onFieldSelect={(field: string): void =>
                      updateFileInfo(index, { idField: field })
                    }
                    placeholder='Select shared ID...'
                  />
                )}
                <Input
                  type='text'
                  placeholder='Prefix (optional)'
                  value={file.prefix || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                    updateFileInfo(index, { prefix: e.target.value })
                  }
                  className='col-start-3 self-end'
                />
              </div>
            </div>
          ))}
          <Button onClick={addFile} variant='outline' className='mt-4 w-min'>
            <Plus className='mr-2 h-4 w-4' />
            Add Another File
          </Button>
        </Section.Items>
      </Section>

      <ActionSection>
        <ActionSection.Button
          onClick={processCombine}
          disabled={files.some(f => !(f.fileName && f.idField))}
        >
          Combine Files
        </ActionSection.Button>
      </ActionSection>
    </div>
  );
}
