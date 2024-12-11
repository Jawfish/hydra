import { FieldSelector } from '@/components/FieldSelector';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { parseJsonl } from '@/lib/jsonl';
import { normalizeString } from '@/lib/utils';
import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'sonner';

export function Backfill() {
  // State for primary file
  const [primaryCsv, setPrimaryCsv] = useState<string>('');
  const [primaryHeaders, setPrimaryHeaders] = useState<string[]>([]);
  const [primarySchema, setPrimarySchema] = useState<string[]>([]);
  const [primaryFileType, setPrimaryFileType] = useState<
    'csv' | 'json' | 'jsonl' | null
  >(null);
  const [primaryMatchColumn, setPrimaryMatchColumn] = useState<string>('');
  const [primaryTargetColumn, setPrimaryTargetColumn] = useState<string>('');

  // State for secondary file
  const [secondaryCsv, setSecondaryCsv] = useState<string>('');
  const [secondaryHeaders, setSecondaryHeaders] = useState<string[]>([]);
  const [secondarySchema, setSecondarySchema] = useState<string[]>([]);
  const [secondaryFileType, setSecondaryFileType] = useState<
    'csv' | 'json' | 'jsonl' | null
  >(null);
  const [secondaryMatchColumn, setSecondaryMatchColumn] = useState<string>('');
  const [secondarySourceColumn, setSecondarySourceColumn] = useState<string>('');

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

  const handleFileUpload = (file: File, isPrimary: boolean) => {
    const reader = new FileReader();
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ignore
    reader.onload = e => {
      const content = e.target?.result as string;

      if (file.name.endsWith('.csv')) {
        const result = Papa.parse(content, { header: true });
        const headers = Object.keys(result.data[0] || {});

        if (isPrimary) {
          setPrimaryCsv(content);
          setPrimaryHeaders(headers);
          setPrimaryFileType('csv');
        } else {
          setSecondaryCsv(content);
          setSecondaryHeaders(headers);
          setSecondaryFileType('csv');
        }
      } else if (file.name.endsWith('.jsonl')) {
        const objects = parseJsonl(content);
        const schema = extractJsonSchema(objects[0]);

        if (isPrimary) {
          setPrimaryCsv(content);
          setPrimarySchema(schema);
          setPrimaryFileType('jsonl');
        } else {
          setSecondaryCsv(content);
          setSecondarySchema(schema);
          setSecondaryFileType('jsonl');
        }
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(content);
        const objects = Array.isArray(data) ? data : [data];
        const schema = extractJsonSchema(objects[0]);

        if (isPrimary) {
          setPrimaryCsv(content);
          setPrimarySchema(schema);
          setPrimaryFileType('json');
        } else {
          setSecondaryCsv(content);
          setSecondarySchema(schema);
          setSecondaryFileType('json');
        }
      }
    };
    reader.readAsText(file);
  };

  const getValueByPath = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  const downloadFile = (content: string, type: 'csv' | 'json' | 'jsonl') => {
    const mimeTypes = {
      csv: 'text/csv',
      json: 'application/json',
      jsonl: 'application/x-jsonlines'
    };

    const blob = new Blob([content], { type: mimeTypes[type] });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `backfilled_${timestamp}.${type}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processBackfill = () => {
    if (!(primaryCsv && secondaryCsv)) {
      toast.error('Please upload both files');
      return;
    }

    if (!(primaryMatchColumn && secondaryMatchColumn && primaryTargetColumn && secondarySourceColumn)) {
      toast.error('Please select all required fields');
      return;
    }

    try {
      // Create lookup map from secondary file
      const lookupMap = new Map();
      if (secondaryFileType === 'csv') {
        const data = Papa.parse(secondaryCsv, { header: true }).data as Record<string, string>[];
        data.forEach(row => {
          lookupMap.set(normalizeString(row[secondaryMatchColumn]), row[secondarySourceColumn]);
        });
      } else {
        const data = secondaryFileType === 'jsonl' ? parseJsonl(secondaryCsv) : JSON.parse(secondaryCsv);
        const objects = Array.isArray(data) ? data : [data];
        objects.forEach(obj => {
          lookupMap.set(
            normalizeString(getValueByPath(obj, secondaryMatchColumn)),
            getValueByPath(obj, secondarySourceColumn)
          );
        });
      }

      // Process primary file
      if (primaryFileType === 'csv') {
        const primaryData = Papa.parse(primaryCsv, { header: true }).data as Record<string, string>[];
        const updatedData = primaryData.map(row => {
          const newRow = { ...row };
          if (!row[primaryTargetColumn] || row[primaryTargetColumn].trim() === '') {
            const matchValue = normalizeString(row[primaryMatchColumn]);
            const backfillValue = lookupMap.get(matchValue);
            if (backfillValue) {
              newRow[primaryTargetColumn] = backfillValue;
            }
          }
          return newRow;
        });

        // Generate new CSV
        const csv = Papa.unparse(updatedData);
        downloadFile(csv, 'csv');
      } else {
        const primaryData = primaryFileType === 'jsonl' ? parseJsonl(primaryCsv) : JSON.parse(primaryCsv);
        const objects = Array.isArray(primaryData) ? primaryData : [primaryData];
        
        const updatedData = objects.map(obj => {
          const newObj = { ...obj };
          const currentValue = getValueByPath(obj, primaryTargetColumn);
          if (!currentValue || String(currentValue).trim() === '') {
            const matchValue = normalizeString(getValueByPath(obj, primaryMatchColumn));
            const backfillValue = lookupMap.get(matchValue);
            if (backfillValue) {
              // Handle nested path updates
              const parts = primaryTargetColumn.split('.');
              let current = newObj;
              for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) {
                  current[parts[i]] = {};
                }
                current = current[parts[i]];
              }
              current[parts[parts.length - 1]] = backfillValue;
            }
          }
          return newObj;
        });

        // Generate new file in original format
        if (primaryFileType === 'jsonl') {
          const jsonl = updatedData.map(obj => JSON.stringify(obj)).join('\n');
          downloadFile(jsonl, 'jsonl');
        } else {
          const json = JSON.stringify(Array.isArray(primaryData) ? updatedData : updatedData[0], null, 2);
          downloadFile(json, 'json');
        }
      }

      toast.success('Processing complete! File downloaded.');
    } catch (error) {
      toast.error(
        `Error processing files: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='flex flex-col mb-12'>
      <div className='mb-10'>
        <Header>
          <Header.Title>Backfill</Header.Title>
          <Header.Description>
            Backfill empty values in a file using data from another file
          </Header.Description>
        </Header>
      </div>

      <div className='flex flex-col gap-14'>
        {/* Primary CSV Section */}
        <div>
          <h3 className='text-lg font-semibold mb-4'>Primary File (To Be Updated)</h3>
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
            <div className='mt-6 flex flex-col gap-6'>
              <div>
                <h4 className='font-medium mb-2'>Match Field</h4>
                <FieldSelector
                  fields={primaryFileType === 'csv' ? primaryHeaders : primarySchema}
                  selectedField={primaryMatchColumn}
                  onFieldSelect={setPrimaryMatchColumn}
                />
              </div>
              <div>
                <h4 className='font-medium mb-2'>Field to Backfill</h4>
                <FieldSelector
                  fields={primaryFileType === 'csv' ? primaryHeaders : primarySchema}
                  selectedField={primaryTargetColumn}
                  onFieldSelect={setPrimaryTargetColumn}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Secondary CSV Section */}
        <div>
          <h3 className='text-lg font-semibold mb-4'>
            Secondary File (Source of Data)
          </h3>
          <div className='flex items-center gap-4'>
            <Button variant='secondary' asChild={true}>
              <label className='cursor-pointer'>
                <input
                  type='file'
                  accept='.csv'
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
            <div className='mt-6 flex flex-col gap-6'>
              <div>
                <h4 className='font-medium mb-2'>Match Field</h4>
                <FieldSelector
                  fields={
                    secondaryFileType === 'csv' ? secondaryHeaders : secondarySchema
                  }
                  selectedField={secondaryMatchColumn}
                  onFieldSelect={setSecondaryMatchColumn}
                />
              </div>
              <div>
                <h4 className='font-medium mb-2'>Source Field</h4>
                <FieldSelector
                  fields={
                    secondaryFileType === 'csv' ? secondaryHeaders : secondarySchema
                  }
                  selectedField={secondarySourceColumn}
                  onFieldSelect={setSecondarySourceColumn}
                />
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={processBackfill}
          disabled={
            !(
              primaryCsv &&
              secondaryCsv &&
              primaryMatchColumn &&
              secondaryMatchColumn &&
              primaryTargetColumn &&
              secondarySourceColumn
            )
          }
          className='max-w-min'
        >
          Process Backfill
        </Button>
      </div>
    </div>
  );
}
