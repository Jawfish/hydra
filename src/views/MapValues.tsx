import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { getAllPaths, getValueByPath, parseJSONL } from '@/lib/jsonl';
import { useFileStore } from '@/store/store';
import { useState } from 'react';
import { toast } from 'sonner';

interface MappedValue {
  [key: string]: {
    [key: string]: unknown;
  };
}

export function MapValues() {
  const {
    setFileError,
    setJsonlSchema,
    setCsvHeaders,
    setFileContent,
    setFileType,
    setFileName,
    resetFileState,
    fileType,
    fileName,
    jsonlSchema,
    csvHeaders,
    fileContent
  } = useFileStore();

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
        const objects = parseJSONL(fileContent);
        const mapped = objects.map(obj => {
          const key = getValueByPath(obj, keyField);
          const values: { [key: string]: unknown } = {};

          valueFields.forEach(field => {
            values[field] = getValueByPath(obj, field);
          });

          return { [key as string]: values };
        });
        setMappedValues(mapped);
      } else if (fileType === 'csv') {
        const lines = fileContent
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean);
        const headers = lines[0].split(',').map(header => header.trim());
        const keyIndex = headers.indexOf(keyField);
        const valueIndexes = valueFields.map(field => headers.indexOf(field));

        const mapped = lines.slice(1).map(line => {
          const values = line.split(',').map(val => val.trim());
          const key = values[keyIndex];
          const mappedValues: { [key: string]: unknown } = {};

          valueFields.forEach((field, i) => {
            mappedValues[field] = values[valueIndexes[i]];
          });

          return { [key]: mappedValues };
        });
        setMappedValues(mapped);
      }
    } catch (_error) {
      toast.error('Error generating mapping');
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
      <Header>
        <Header.Title>Map Values</Header.Title>
        <Header.Description>
          Create a mapping of key-value pairs from a CSV or JSONL file
        </Header.Description>
      </Header>
      <>
        <FileUpload />
      </>
      {fileType && (
        <>
          <div className='mb-7 mt-12'>
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

          <div className='flex gap-4 mt-12'>
            <Button onClick={generateMapping}>Generate Mapping</Button>
            <Button
              variant='outline'
              onClick={copyToClipboard}
              disabled={mappedValues.length === 0}
            >
              Copy to Clipboard
            </Button>
          </div>
        </>
      )}

      {mappedValues.length > 0 && (
        <pre className='p-4 bg-muted rounded-lg overflow-auto max-h-[400px]'>
          {JSON.stringify(mappedValues, null, 2)}
        </pre>
      )}
    </div>
  );
}
