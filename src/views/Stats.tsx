import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { toast } from 'sonner';
import { useWorkingFileStore } from '@/store/store';
import { getAllPaths, getValueByPath } from '@/lib/parse';

interface FieldAnalysisDetail {
  identifier: string;
  value: string;
  isEmpty: boolean;
}

export function Stats() {
  const { fileName, fileContentRaw, fileContentParsed, setFileContent } = useWorkingFileStore();
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [selectedAnalysisField, setSelectedAnalysisField] = useState<string>('');
  const [fieldAnalysis, setFieldAnalysis] = useState<FieldAnalysisDetail[]>([]);

  const schema = fileName ? getAllPaths(fileContentParsed[0] || {}) : [];

  const handleFileUpload = (name: string, content: string, fileType: string) => {
    try {
      setFileContent(content, fileType as 'json' | 'csv' | 'jsonl');
      toast.success('File analysis complete!');
    } catch (error) {
      toast.error(
        `Error analyzing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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

  const analyzeFieldDetails = (field: string, identifierField: string) => {
    if (!(fileContentParsed && field && identifierField)) {
      return;
    }

    const details: FieldAnalysisDetail[] = fileContentParsed.map(row => {
      const fieldValue = getValueByPath(row, field);
      const identifier = getValueByPath(row, identifierField);

      const stringValue = String(fieldValue ?? '').trim();
      const isEmpty =
        stringValue === '' || fieldValue === null || fieldValue === undefined;

      return {
        identifier: String(identifier),
        value: isEmpty ? '' : stringValue,
        isEmpty
      };
    });

    setFieldAnalysis(details.filter(d => d.isEmpty));
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
          <FileUpload onFileUpload={handleFileUpload} />
        </div>

        {fileName && fileContentParsed.length > 0 && (
          <div className='flex flex-col gap-6'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='rounded-lg border p-4'>
                <h3 className='font-medium mb-2'>File Information</h3>
                <p>Name: {fileName}</p>
                <p>Total Rows: {fileContentParsed.length}</p>
              </div>

              {schema && (
                <div className='rounded-lg border p-4'>
                  <h3 className='font-medium mb-2'>Schema</h3>
                  <ScrollArea className='h-[100px]'>
                    <div className='space-y-1'>
                      {schema.map(field => (
                        <p key={field} className='text-sm'>
                          {field}
                        </p>
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
                  {schema.map(field => {
                    const analysis = analyzeField(fileContentParsed, field);
                    return (
                      <div key={field} className='grid grid-cols-4 gap-4 text-sm'>
                        <div className='truncate' title={field}>
                          {field}
                        </div>
                        <div>{analysis.nonEmptyCount}</div>
                        <div>{analysis.emptyCount}</div>
                        <div>{analysis.uniqueValues}</div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className='rounded-lg border p-4'>
              <h3 className='font-medium mb-4'>Detailed Analysis</h3>
              <div className='flex gap-4 mb-4'>
                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium'>Identifier Field</label>
                  <select
                    className='rounded-md border p-2'
                    value={selectedIdentifier}
                    onChange={e => setSelectedIdentifier(e.target.value)}
                  >
                    <option value=''>Select identifier field...</option>
                    {schema.map(field => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium'>Analyze Field</label>
                  <select
                    className='rounded-md border p-2'
                    value={selectedAnalysisField}
                    onChange={e => {
                      setSelectedAnalysisField(e.target.value);
                      analyzeFieldDetails(e.target.value, selectedIdentifier);
                    }}
                  >
                    <option value=''>Select field to analyze...</option>
                    {schema.map(field => (
                      <option key={field} value={field}>
                        {field}
                      </option>
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
          </div>
        )}
      </div>
    </div>
  );
}
