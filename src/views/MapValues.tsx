import { useState } from 'react';
import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/store/store';
import { parseJSONL, getAllPaths, getValueByPath } from '@/lib/jsonl';
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
    resetFileState,
    fileType,
    jsonlSchema,
    csvHeaders,
    fileContent
  } = useFileStore();

  const [keyField, setKeyField] = useState<string>('');
  const [valueFields, setValueFields] = useState<string[]>([]);
  const [mappedValues, setMappedValues] = useState<MappedValue[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    resetFileState();
    setKeyField('');
    setValueFields([]);
    setMappedValues([]);

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content = await file.text();
      const type = file.name.toLowerCase().endsWith('.csv')
        ? 'csv'
        : file.name.toLowerCase().endsWith('.jsonl')
          ? 'jsonl'
          : null;

      if (!type) {
        setFileError('Please upload a .csv or .jsonl file');
        return;
      }

      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      setFileType(type);
      setFileContent(content);

      if (type === 'jsonl') {
        const parsedObjects = parseJSONL(content);
        if (parsedObjects.length === 0) {
          setFileError('No valid JSONL data found in file');
          return;
        }
        const paths = getAllPaths(parsedObjects[0]);
        if (paths.length > 0) {
          setJsonlSchema(paths);
        } else {
          setFileError('No valid fields found in JSONL data');
        }
      } else {
        const firstLine = content.split('\n')[0];
        if (firstLine) {
          setCsvHeaders(firstLine.split(',').map(header => header.trim()));
        }
      }
    } catch (error) {
      setFileError(
        `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      e.target.value = '';
    }
  };

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
        const lines = fileContent.split('\n').map(line => line.trim()).filter(Boolean);
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
    } catch (error) {
      toast.error('Error generating mapping');
      console.error(error);
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
    <div className='flex flex-col gap-6'>
      <FileUpload onUpload={handleFileUpload} />
      
      <div className='flex flex-col gap-4'>
        <h3 className='text-lg font-semibold'>Key Field</h3>
        <FieldSelector
          fileType={fileType}
          fields={fileType === 'jsonl' ? jsonlSchema : csvHeaders}
          selectedField={keyField}
          onFieldSelect={handleKeyFieldSelect}
        />
      </div>

      <div className='flex flex-col gap-4'>
        <h3 className='text-lg font-semibold'>Value Fields</h3>
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
        <pre className='p-4 bg-muted rounded-lg overflow-auto max-h-[400px]'>
          {JSON.stringify(mappedValues, null, 2)}
        </pre>
      )}
    </div>
  );
}
