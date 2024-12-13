import { FieldSelector } from '@/components/FieldSelector';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { parseJsonl } from '@/lib/json';
import { normalizeString } from '@/lib/parse';
import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'sonner';

export function Deduplicate() {
  // State for primary file
  const [primaryFile, setPrimaryFile] = useState<string>('');
  const [primaryHeaders, setPrimaryHeaders] = useState<string[]>([]);
  const [primarySchema, setPrimarySchema] = useState<string[]>([]);
  const [primaryFileType, setPrimaryFileType] = useState<
    'csv' | 'json' | 'jsonl' | null
  >(null);
  const [primaryMatchColumn, setPrimaryMatchColumn] = useState<string>('');

  // State for secondary file
  const [secondaryFile, setSecondaryFile] = useState<string>('');
  const [secondaryHeaders, setSecondaryHeaders] = useState<string[]>([]);
  const [secondarySchema, setSecondarySchema] = useState<string[]>([]);
  const [secondaryFileType, setSecondaryFileType] = useState<
    'csv' | 'json' | 'jsonl' | null
  >(null);
  const [secondaryMatchColumn, setSecondaryMatchColumn] = useState<string>('');

  const extractJsonSchema = (obj: Record<string, unknown>, prefix = ''): string[] => {
    let schema: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        schema = [
          ...schema,
          path,
          ...extractJsonSchema(value as Record<string, unknown>, path)
        ];
      } else {
        schema.push(path);
      }
    }
    return schema;
  };

  const getValueByPath = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  const handleFileUpload = (file: File, isPrimary: boolean) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;

      if (file.name.endsWith('.csv')) {
        const result = Papa.parse(content, { header: true });
        const headers = Object.keys(result.data[0] || {});

        if (isPrimary) {
          setPrimaryFile(content);
          setPrimaryHeaders(headers);
          setPrimaryFileType('csv');
        } else {
          setSecondaryFile(content);
          setSecondaryHeaders(headers);
          setSecondaryFileType('csv');
        }
      } else if (file.name.endsWith('.jsonl')) {
        const objects = parseJsonl(content);
        const schema = extractJsonSchema(objects[0]);

        if (isPrimary) {
          setPrimaryFile(content);
          setPrimarySchema(schema);
          setPrimaryFileType('jsonl');
        } else {
          setSecondaryFile(content);
          setSecondarySchema(schema);
          setSecondaryFileType('jsonl');
        }
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(content);
        const objects = Array.isArray(data) ? data : [data];
        const schema = extractJsonSchema(objects[0]);

        if (isPrimary) {
          setPrimaryFile(content);
          setPrimarySchema(schema);
          setPrimaryFileType('json');
        } else {
          setSecondaryFile(content);
          setSecondarySchema(schema);
          setSecondaryFileType('json');
        }
      }
    };
    reader.readAsText(file);
  };

  const processDeduplicate = () => {
    if (!(primaryFile && secondaryFile)) {
      toast.error('Please upload both files');
      return;
    }

    if (!(primaryMatchColumn && secondaryMatchColumn)) {
      toast.error('Please select match columns for both files');
      return;
    }

    try {
      // Create set of values from secondary file
      const secondaryValues = new Set();

      if (secondaryFileType === 'csv') {
        const data = Papa.parse(secondaryFile, { header: true }).data as Record<
          string,
          string
        >[];
        data.forEach(row =>
          secondaryValues.add(normalizeString(row[secondaryMatchColumn]))
        );
      } else {
        const data =
          secondaryFileType === 'jsonl'
            ? parseJsonl(secondaryFile)
            : JSON.parse(secondaryFile);
        const objects = Array.isArray(data) ? data : [data];
        objects.forEach(obj =>
          secondaryValues.add(
            normalizeString(getValueByPath(obj, secondaryMatchColumn))
          )
        );
      }

      // Process primary file
      let result;
      let originalCount = 0;
      let finalCount = 0;

      if (primaryFileType === 'csv') {
        const data = Papa.parse(primaryFile, { header: true }).data as Record<
          string,
          string
        >[];
        originalCount = data.length;
        result = data.filter(
          row => !secondaryValues.has(normalizeString(row[primaryMatchColumn]))
        );
        finalCount = result.length;
        const output = Papa.unparse(result);
        return downloadFile(output, 'csv', originalCount - finalCount);
      }
      const data =
        primaryFileType === 'jsonl' ? parseJsonl(primaryFile) : JSON.parse(primaryFile);
      const objects = Array.isArray(data) ? data : [data];
      originalCount = objects.length;
      result = objects.filter(
        obj =>
          !secondaryValues.has(normalizeString(getValueByPath(obj, primaryMatchColumn)))
      );
      finalCount = result.length;
      const output = JSON.stringify(result, null, 2);
      return downloadFile(output, 'json', originalCount - finalCount);
    } catch (error) {
      toast.error(
        `Error processing files: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const downloadFile = (
    content: string,
    type: 'csv' | 'json',
    removedCount: number
  ) => {
    const blob = new Blob([content], {
      type: type === 'csv' ? 'text/csv' : 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `deduplicated_${timestamp}.${type}`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(
      `Processing complete! ${removedCount} ${
        removedCount === 1 ? 'item was' : 'items were'
      } removed. File downloaded.`
    );
  };

  return (
    <div className='flex flex-col mb-12'>
      <div className='mb-10'>
        <Header>
          <Header.Title>Deduplicate Files</Header.Title>
          <Header.Description>
            Remove entries from a file if they match values in another file
          </Header.Description>
        </Header>
      </div>

      <div className='flex flex-col gap-14'>
        {/* Primary File Section */}
        <div>
          <h3 className='text-lg font-semibold mb-4'>
            Primary File (To Be Deduplicated)
          </h3>
          <div className='flex items-center gap-4'>
            <Button variant='secondary' asChild={true}>
              <label className='cursor-pointer'>
                <input
                  type='file'
                  accept='.csv,.json,.jsonl'
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, true);
                    }
                  }}
                  className='hidden'
                />
                Select File
              </label>
            </Button>
          </div>
          {(primaryHeaders.length > 0 || primarySchema.length > 0) && (
            <div className='mt-6'>
              <h4 className='font-medium mb-2'>Match Field</h4>
              <FieldSelector
                fields={primaryFileType === 'csv' ? primaryHeaders : primarySchema}
                selectedField={primaryMatchColumn}
                onFieldSelect={setPrimaryMatchColumn}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Secondary File Section */}
        <div>
          <h3 className='text-lg font-semibold mb-4'>
            Secondary File (Reference for Duplicates)
          </h3>
          <div className='flex items-center gap-4'>
            <Button variant='secondary' asChild={true}>
              <label className='cursor-pointer'>
                <input
                  type='file'
                  accept='.csv,.json,.jsonl'
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, false);
                    }
                  }}
                  className='hidden'
                />
                Select File
              </label>
            </Button>
          </div>
          {(secondaryHeaders.length > 0 || secondarySchema.length > 0) && (
            <div className='mt-6'>
              <h4 className='font-medium mb-2'>Match Field</h4>
              <FieldSelector
                fields={
                  secondaryFileType === 'csv' ? secondaryHeaders : secondarySchema
                }
                selectedField={secondaryMatchColumn}
                onFieldSelect={setSecondaryMatchColumn}
              />
            </div>
          )}
        </div>

        <Button
          onClick={processDeduplicate}
          disabled={
            !(
              primaryFile &&
              secondaryFile &&
              primaryMatchColumn &&
              secondaryMatchColumn
            )
          }
          className='max-w-min'
        >
          Process Deduplication
        </Button>
      </div>
    </div>
  );
}
