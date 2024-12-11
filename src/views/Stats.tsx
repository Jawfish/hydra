import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseJsonl } from '@/lib/jsonl';
import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'sonner';

interface FieldAnalysisDetail {
  identifier: string;
  value: string;
  isEmpty: boolean;
}

interface FileStats {
  fileName: string;
  fileType: 'csv' | 'json' | 'jsonl';
  rowCount: number;
  fields: {
    name: string;
    nonEmptyCount: number;
    emptyCount: number;
    uniqueValues: number;
  }[];
  schema?: string[];
  headers?: string[];
  fileContent: string;
}

export function Stats() {
  const [stats, setStats] = useState<FileStats | null>(null);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [selectedAnalysisField, setSelectedAnalysisField] = useState<string>('');
  const [fieldAnalysis, setFieldAnalysis] = useState<FieldAnalysisDetail[]>([]);

  const analyzeFieldDetails = (field: string, identifierField: string) => {
    if (!stats || !field || !identifierField) return;

    const details: FieldAnalysisDetail[] = [];
    let data;
    
    if (stats.fileType === 'csv') {
      data = Papa.parse(stats.fileContent, { header: true }).data as any[];
    } else if (stats.fileType === 'jsonl') {
      data = parseJsonl(stats.fileContent);
    } else { // JSON
      data = JSON.parse(stats.fileContent);
      // Ensure data is an array
      if (!Array.isArray(data)) {
        data = [data];
      }
    }

    data.forEach(row => {
      const fieldValue = typeof row === 'object' ? getValueByPath(row, field) : row[field];
      const identifier = typeof row === 'object' ? getValueByPath(row, identifierField) : row[identifierField];
      
      const stringValue = String(fieldValue ?? '').trim();
      const isEmpty = stringValue === '' || fieldValue === null || fieldValue === undefined;

      details.push({
        identifier: String(identifier),
        value: isEmpty ? '' : stringValue,
        isEmpty
      });
    });

    setFieldAnalysis(details.filter(d => d.isEmpty));
  };

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

  const analyzeField = (data: any[], field: string) => {
    const uniqueValues = new Set();
    let nonEmptyCount = 0;
    let emptyCount = 0;

    data.forEach(row => {
      const value = typeof row === 'object' ? getValueByPath(row, field) : row[field];
      const stringValue = String(value).trim();
      
      if (stringValue === '' || value === null || value === undefined) {
        emptyCount++;
      } else {
        nonEmptyCount++;
        uniqueValues.add(stringValue);
      }
    });

    return {
      name: field,
      nonEmptyCount,
      emptyCount,
      uniqueValues: uniqueValues.size
    };
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;

      try {
        if (file.name.endsWith('.csv')) {
          const result = Papa.parse(content, { header: true });
          const headers = Object.keys(result.data[0] || {});
          const fields = headers.map(header => 
            analyzeField(result.data as any[], header)
          );

          setStats({
            fileName: file.name,
            fileType: 'csv',
            rowCount: result.data.length,
            fields,
            headers,
            fileContent: content
          });
        } else if (file.name.endsWith('.jsonl')) {
          const objects = parseJsonl(content);
          const schema = extractJsonSchema(objects[0]);
          const fields = schema.map(field => 
            analyzeField(objects, field)
          );

          setStats({
            fileName: file.name,
            fileType: 'jsonl',
            rowCount: objects.length,
            fields,
            schema,
            fileContent: content
          });
        } else if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          const objects = Array.isArray(data) ? data : [data];
          const schema = extractJsonSchema(objects[0]);
          const fields = schema.map(field => 
            analyzeField(objects, field)
          );

          setStats({
            fileName: file.name,
            fileType: 'json',
            rowCount: objects.length,
            fields,
            schema,
            fileContent: content
          });
        }
        
        toast.success('File analysis complete!');
      } catch (error) {
        toast.error(
          `Error analyzing file: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className='flex flex-col mb-12'>
      <div className='mb-10'>
        <Header>
          <Header.Title>File Statistics</Header.Title>
          <Header.Description>
            Analyze CSV, JSON, or JSONL files to get detailed statistics
          </Header.Description>
        </Header>
      </div>

      <div className='flex flex-col gap-8'>
        <div>
          <Button variant='secondary' asChild={true}>
            <label className='cursor-pointer'>
              <input
                type='file'
                accept='.csv,.json,.jsonl'
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className='hidden'
              />
              Select File
            </label>
          </Button>
        </div>

        {stats && (
          <div className='flex flex-col gap-6'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='rounded-lg border p-4'>
                <h3 className='font-medium mb-2'>File Information</h3>
                <p>Name: {stats.fileName}</p>
                <p>Type: {stats.fileType.toUpperCase()}</p>
                <p>Total Rows: {stats.rowCount}</p>
              </div>
              
              {(stats.headers || stats.schema) && (
                <div className='rounded-lg border p-4'>
                  <h3 className='font-medium mb-2'>
                    {stats.headers ? 'Headers' : 'Schema'}
                  </h3>
                  <ScrollArea className='h-[100px]'>
                    <div className='space-y-1'>
                      {(stats.headers || stats.schema)?.map(field => (
                        <p key={field} className='text-sm'>{field}</p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className='rounded-lg border p-4'>
              <h3 className='font-medium mb-4'>Field Analysis</h3>
              <div className='grid grid-cols-4 gap-4 text-sm font-medium mb-2'>
                <div>Field</div>
                <div>Non-Empty</div>
                <div>Empty</div>
                <div>Unique Values</div>
              </div>
              <ScrollArea className='h-[300px]'>
                <div className='space-y-2'>
                  {stats.fields.map(field => (
                    <div key={field.name} className='grid grid-cols-4 gap-4 text-sm'>
                      <div className='truncate' title={field.name}>
                        {field.name}
                      </div>
                      <div>{field.nonEmptyCount}</div>
                      <div>{field.emptyCount}</div>
                      <div>{field.uniqueValues}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {stats && (
              <div className='rounded-lg border p-4'>
                <h3 className='font-medium mb-4'>Detailed Analysis</h3>
                <div className='flex gap-4 mb-4'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium'>Identifier Field</label>
                    <select 
                      className='rounded-md border p-2'
                      value={selectedIdentifier}
                      onChange={(e) => setSelectedIdentifier(e.target.value)}
                    >
                      <option value="">Select identifier field...</option>
                      {(stats.headers || stats.schema)?.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium'>Analyze Field</label>
                    <select 
                      className='rounded-md border p-2'
                      value={selectedAnalysisField}
                      onChange={(e) => {
                        setSelectedAnalysisField(e.target.value);
                        analyzeFieldDetails(e.target.value, selectedIdentifier);
                      }}
                    >
                      <option value="">Select field to analyze...</option>
                      {(stats.headers || stats.schema)?.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {fieldAnalysis.length > 0 && (
                  <div>
                    <h4 className='text-sm font-medium mb-2'>
                      Records with empty values in {selectedAnalysisField}
                    </h4>
                    <ScrollArea className='h-[200px]'>
                      <div className='space-y-2'>
                        {fieldAnalysis.map((detail, index) => (
                          <div key={index} className='text-sm'>
                            {selectedIdentifier}: {detail.identifier}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
