import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllPaths, getValueByPath } from '@/lib/parse';
import { useWorkingFileStore } from '@/store/store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FieldAnalysisDetail {
  identifier: string;
  value: string;
  isEmpty: boolean;
}

export function Stats() {
  const { fileName, fileContentParsed, setFileContent } = useWorkingFileStore();
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [selectedAnalysisField, setSelectedAnalysisField] = useState<string>('');
  const [fieldAnalysis, setFieldAnalysis] = useState<FieldAnalysisDetail[]>([]);

  const schema = fileName
    ? (() => {
        console.debug('Generating schema from first row:', fileContentParsed[0]);
        const paths = getAllPaths(fileContentParsed[0] || {});
        console.debug('Generated schema paths:', paths);
        return paths;
      })()
    : [];

  useEffect(() => {
    if (fileContentParsed.length > 0) {
      console.debug('Parsed content updated:', fileContentParsed);
      console.debug('Total rows:', fileContentParsed.length);
      console.debug('First few rows:', fileContentParsed.slice(0, 5));
      toast.success(`File analysis complete! ${fileContentParsed.length} rows loaded.`);
    }
  }, [fileContentParsed]);

  useEffect(() => {
    console.debug('Current file state:', {
      fileName,
      fileContentParsed: fileContentParsed,
      fileContentParsedLength: fileContentParsed.length
    });
  }, [fileName, fileContentParsed]);

  const handleFileUpload = (name: string, content: string, fileType: string) => {
    try {
      console.debug('Uploading file:', { name, fileType });
      console.debug('Raw content sample:', content.slice(0, 200));
      console.debug('Content length:', content.length);

      try {
        useWorkingFileStore.getState().setFileName(name);
        setFileContent(content, fileType as 'json' | 'csv' | 'jsonl');
      } catch (parseError) {
        console.error('File content parsing error:', parseError);
        toast.error(
          `Parsing error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`
        );
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(
        `Error analyzing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const analyzeField = (data: Record<string, unknown>[], field: string) => {
    const uniqueValues = new Set();
    let nonEmptyCount = 0;
    let emptyCount = 0;

    for (const row of data) {
      const value = typeof row === 'object' ? getValueByPath(row, field) : row[field];
      const stringValue = String(value).trim();

      if (stringValue === '' || value === null || value === undefined) {
        emptyCount++;
      } else {
        nonEmptyCount++;
        uniqueValues.add(stringValue);
      }
    }

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

    const details: FieldAnalysisDetail[] = [];
    for (const row of fileContentParsed) {
      const fieldValue = getValueByPath(row, field);
      const identifier = getValueByPath(row, identifierField);

      const stringValue = String(fieldValue ?? '').trim();
      const isEmpty =
        stringValue === '' || fieldValue === null || fieldValue === undefined;

      details.push({
        identifier: String(identifier),
        value: isEmpty ? '' : stringValue,
        isEmpty
      });
    }

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
                  <label htmlFor='identifier-field' className='text-sm font-medium'>
                    Identifier Field
                  </label>
                  <select
                    id='identifier-field'
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
                  <label htmlFor='analyze-field' className='text-sm font-medium'>
                    Analyze Field
                  </label>
                  <select
                    id='analyze-field'
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
                      {fieldAnalysis.map(detail => (
                        <div key={detail.identifier} className='text-sm'>
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
