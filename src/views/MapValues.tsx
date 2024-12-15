import { ActionSection } from '@/components/ActionSection';
import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Section } from '@/components/Section';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getAllPaths, getValueByPath } from '@/lib/parse';
import { Button } from '@/shadcn/components/ui/button';
import { Textarea } from '@/shadcn/components/ui/textarea';
import { useWorkingFileStore } from '@/store/store';
import { useState } from 'react';
import type { JSX } from 'react';
import { toast } from 'sonner';

export function MapValues(): JSX.Element {
  const { fileContentParsed, fileName } = useWorkingFileStore();
  const handleFileUpload = useFileUpload('working');

  const availableFields = fileContentParsed[0] ? getAllPaths(fileContentParsed[0]) : [];

  const [keyField, setKeyField] = useState<string>('');
  const [valueFields, setValueFields] = useState<string[]>([]);
  const [mappedValues, setMappedValues] = useState<Record<string, unknown>>({});

  const handleKeyFieldSelect = (field: string): void => {
    setKeyField(field);
  };

  const handleValueFieldSelect = (field: string): void => {
    setValueFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      }
      return [...prev, field];
    });
  };

  const generateMapping = (): void => {
    if (!keyField || valueFields.length === 0) {
      toast.error('Please select a key field and at least one value field');
      return;
    }

    try {
      const mapped = fileContentParsed.reduce(
        (acc, obj) => {
          const key = getValueByPath(obj, keyField);
          const values: { [key: string]: unknown } = {};

          for (const field of valueFields) {
            values[field] = getValueByPath(obj, field);
          }

          acc[key as string] = values;
          return acc;
        },
        {} as Record<string, unknown>
      );

      setMappedValues(mapped);

      toast.success(`Generated mapping for ${Object.keys(mapped).length} objects`);
    } catch (error) {
      toast.error(
        `Error generating mapping: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const copyToClipboard = (): void => {
    const pythonDict = JSON.stringify(mappedValues, null, 2)
      .replace(/"/g, "'")
      .replace(/\[/g, '[')
      .replace(/\]/g, ']')
      .replace(/\{/g, '{')
      .replace(/\}/g, '}');

    navigator.clipboard.writeText(pythonDict).then(
      () => toast.success('Copied to clipboard'),
      () => toast.error('Failed to copy to clipboard')
    );
  };

  return (
    <div className='mb-12 flex flex-col gap-16'>
      <Header>
        <Header.Title>Map Values</Header.Title>
        <Header.Description>
          Create a mapping of key-value pairs from an uploaded file
        </Header.Description>
      </Header>

      <Section>
        <Section.Title>Working File</Section.Title>
        <Section.Description>The file to generate a mapping from</Section.Description>
        <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />
      </Section>
      {fileContentParsed.length > 0 && (
        <>
          <Section>
            <Section.Title>Key Field</Section.Title>
            <Section.Description>
              Select a field to use as the key in the mapping
            </Section.Description>
            <Section.Items>
              <FieldSelector
                fields={availableFields}
                selectedField={keyField}
                onFieldSelect={handleKeyFieldSelect}
                placeholder='Select key field'
              />
            </Section.Items>
          </Section>

          <Section>
            <Section.Title>Value Fields</Section.Title>
            <Section.Description>
              Select one or more fields to use as values in the mapping
            </Section.Description>
            <Section.Items>
              <div className='flex flex-wrap gap-2'>
                {availableFields.map(field => (
                  <Button
                    key={field}
                    variant={valueFields.includes(field) ? 'default' : 'outline'}
                    onClick={(): void => handleValueFieldSelect(field)}
                    className='h-8'
                  >
                    {field}
                  </Button>
                ))}
              </div>
            </Section.Items>
          </Section>
          <ActionSection>
            <div className='flex gap-4'>
              <ActionSection.Button 
                onClick={generateMapping}
                disabled={!keyField || valueFields.length === 0}
              >
                Generate Mapping
              </ActionSection.Button>
              <ActionSection.Button
                onClick={copyToClipboard}
                disabled={Object.keys(mappedValues).length === 0}
                variant='outline'
              >
                Copy to Clipboard
              </ActionSection.Button>
            </div>
            {mappedValues && (
              <Textarea
                id='mappedValues'
                rows={12}
                value={JSON.stringify(mappedValues, null, 2)}
                readOnly={true}
                className='resize-none rounded-md font-mono'
              />
            )}
              >
                Generate Mapping
              </ActionSection.Button>
              <ActionSection.Button
                onClick={copyToClipboard}
                disabled={Object.keys(mappedValues).length === 0}
                variant='outline'
              >
                Copy to Clipboard
              </ActionSection.Button>
            </div>
            {mappedValues && (
              <Textarea
                id='mappedValues'
                rows={12}
                value={JSON.stringify(mappedValues, null, 2)}
                readOnly={true}
                className='resize-none rounded-md font-mono'
              />
            )}
          </ActionSection>
        </>
      )}
    </div>
  );
}
