import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { getValueByPath, parseJsonl } from '@/lib/jsonl';
import { useFileStore } from '@/store/store';
import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'sonner';
interface MappedValue {
  [key: string]: {
    [key: string]: unknown;
  };
}

export function MapValues() {
  const { fileType, jsonlSchema, csvHeaders, fileContent } = useFileStore();

  const [keyField, setKeyField] = useState<string>('');
  const [valueFields, setValueFields] = useState<string[]>([]);
  const [mappedValues, setMappedValues] = useState<MappedValue[]>([]);

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
      if (fileType === 'jsonl') {
        const objects = parseJsonl(fileContent);
        const mapped = objects.map(obj => {
          const key = getValueByPath(obj, keyField);
          const values: { [key: string]: unknown } = {};

          for (const field of valueFields) {
            values[field] = getValueByPath(obj, field);
          }

          return { [key as string]: values };
        });

        setMappedValues(mapped);
        toast.success(`Generated mapping for ${mapped.length} objects`);
      } else if (fileType === 'csv') {
        const csvData: string[][] = Papa.parse<string[]>(fileContent, {
          skipEmptyLines: true
        }).data;
        const headers = csvData[0];
        const rows = csvData.slice(1);

        const keyIndex = headers.indexOf(keyField);
        const valueIndices = valueFields.map(field => headers.indexOf(field));

        const mapped = rows.map(row => {
          const key = row[keyIndex];
          const values: { [key: string]: unknown } = {};

          for (const index of valueIndices) {
            values[headers[index]] = row[index];
          }

          return { [key as string]: values };
        });

        setMappedValues(mapped);
        toast.success(`Generated mapping for ${mapped.length} rows`);
      }
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
    <div className='flex flex-col'>
      <div>
        <div className='mb-10'>
          <Header>
            <Header.Title>Map Values</Header.Title>
            <Header.Description>
              Create a mapping of key-value pairs from a CSV or JSONL file
            </Header.Description>
          </Header>
        </div>
        <FileUpload />
      </div>
      {fileType && (
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
                fields={fileType === 'jsonl' ? jsonlSchema : csvHeaders}
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
                {(fileType === 'jsonl' ? jsonlSchema : csvHeaders).map(field => (
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
            <div className='flex flex-col gap-6 bg-muted p-6 -m-6 mt-6 rounded-md'>
              <div className='flex gap-4'>
                <Button onClick={generateMapping}>Generate Mapping</Button>
                <Button
                  variant='outline'
                  onClick={copyToClipboard}
                  disabled={mappedValues.length === 0}
                >
                  Copy to Clipboard
                </Button>
              </div>
              {mappedValues.length > 0 && (
                <Textarea
                  id='mappedValues'
                  rows={12}
                  value={JSON.stringify(mappedValues, null, 2)}
                  readOnly={true}
                  className='font-mono bg-white rounded-md resize-none'
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
