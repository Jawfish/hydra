import { ActionSection } from '@/components/ActionSection';
import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getAllPaths, getValueByPath } from '@/lib/parse';
import { Button } from '@/shadcn/components/ui/button';
import { Separator } from '@/shadcn/components/ui/separator';
import { Textarea } from '@/shadcn/components/ui/textarea';
import { useWorkingFileStore } from '@/store/store';
import { useState } from 'react';
import { toast } from 'sonner';

export function MapValues() {
  const { fileContentParsed, fileName } = useWorkingFileStore();
  const handleFileUpload = useFileUpload('working');

  const availableFields = fileContentParsed[0] ? getAllPaths(fileContentParsed[0]) : [];

  const [keyField, setKeyField] = useState<string>('');
  const [valueFields, setValueFields] = useState<string[]>([]);
  const [mappedValues, setMappedValues] = useState<Record<string, unknown>>({});

  const handleKeyFieldSelect = (field: string) => {
    setKeyField(field);
  };

  const handleValueFieldSelect = (field: string) => {
    setValueFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      }
      return [...prev, field];
    });
  };

  const generateMapping = () => {
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

  const copyToClipboard = () => {
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
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>Map Values</Header.Title>
        <Header.Description>
          Create a mapping of key-value pairs from an uploaded file
        </Header.Description>
      </Header>

      <div className='mb-4'>
        <h3 className='text-lg font-semibold'>Working File</h3>
        <p className='text-muted-foreground text-sm'>
          The file to generate a mapping from
        </p>
      </div>
      <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />
      {fileContentParsed.length > 0 && (
        <>
          <Separator className='my-14 h-[1px]' />
          <div className='flex flex-col gap-14'>
            <div>
              <div className='mb-5'>
                <h3 className='text-lg font-semibold'>Key Field</h3>
                <p className='text-sm text-muted-foreground'>
                  Select a field to use as the key in the mapping
                </p>
              </div>
              <FieldSelector
                fields={availableFields}
                selectedField={keyField}
                onFieldSelect={handleKeyFieldSelect}
              />
            </div>
            <Separator />
            <div>
              <div className='mb-5'>
                <h3 className='text-lg font-semibold'>Value Fields</h3>
                <p className='text-sm text-muted-foreground'>
                  Select one or more fields to use as values in the mapping
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                {availableFields.map(field => (
                  <Button
                    key={field}
                    variant={valueFields.includes(field) ? 'default' : 'outline'}
                    onClick={() => handleValueFieldSelect(field)}
                    className='h-8'
                  >
                    {field}
                  </Button>
                ))}
              </div>
            </div>
            <ActionSection>
              <div className='flex gap-4'>
                <ActionSection.Button onClick={generateMapping}>
                  Generate Mapping
                </ActionSection.Button>
                <ActionSection.Button
                  onClick={copyToClipboard}
                  disabled={Object.keys(mappedValues).length === 0}
                  className="bg-secondary hover:bg-secondary/90"
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
                  className='font-mono rounded-md resize-none'
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
