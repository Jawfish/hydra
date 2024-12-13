import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getAllPaths } from '@/lib/parse';
import { getValueByPath } from '@/lib/parse';
import { jsonToCsv } from '@/lib/parse';
import { useReferenceFileStore, useWorkingFileStore } from '@/store/store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function Backfill() {
  const {
    fileName: workingFileName,
    fileContentParsed: workingFileContent,
    setFileContent: setWorkingFileContent
  } = useWorkingFileStore();

  const {
    fileName: referenceFileName,
    fileContentParsed: referenceFileContent,
    setFileContent: setReferenceFileContent
  } = useReferenceFileStore();

  const [workingFileSchema, setWorkingFileSchema] = useState<string[]>([]);
  const [referenceFileSchema, setReferenceFileSchema] = useState<string[]>([]);

  const [workingMatchField, setWorkingMatchField] = useState<string>('');
  const [referenceMatchField, setReferenceMatchField] = useState<string>('');
  const [workingFillField, setWorkingFillField] = useState<string>('');
  const [referenceFillField, setReferenceFillField] = useState<string>('');

  // Debug logging for file content changes
  useEffect(() => {
    console.debug('Working File Content Changed:', {
      fileName: workingFileName,
      contentLength: workingFileContent.length,
      firstRow: workingFileContent[0]
    });
  }, [workingFileContent, workingFileName]);

  useEffect(() => {
    console.debug('Reference File Content Changed:', {
      fileName: referenceFileName,
      contentLength: referenceFileContent.length,
      firstRow: referenceFileContent[0]
    });
  }, [referenceFileContent, referenceFileName]);

  // Generate schemas when files are loaded
  useEffect(() => {
    if (workingFileContent.length > 0) {
      const schema = getAllPaths(workingFileContent[0] || {});
      setWorkingFileSchema(schema);
    }
  }, [workingFileContent]);

  useEffect(() => {
    if (referenceFileContent.length > 0) {
      const schema = getAllPaths(referenceFileContent[0] || {});
      setReferenceFileSchema(schema);
    }
  }, [referenceFileContent]);

  const handleWorkingFileUpload = (name: string, content: string, fileType: string) => {
    try {
      console.debug('Uploading Working File:', {
        name,
        fileType,
        contentLength: content.length
      });
      useWorkingFileStore.getState().setFileName(name);
      setWorkingFileContent(content, fileType as 'json' | 'csv' | 'jsonl');
      toast.success(`Working file ${name} uploaded successfully`);
    } catch (error) {
      console.error('Working File Upload Error:', error);
      toast.error(
        `Error uploading working file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleReferenceFileUpload = (
    name: string,
    content: string,
    fileType: string
  ) => {
    try {
      console.debug('Uploading Reference File:', {
        name,
        fileType,
        contentLength: content.length
      });
      useReferenceFileStore.getState().setFileName(name);
      setReferenceFileContent(content, fileType as 'json' | 'csv' | 'jsonl');
      toast.success(`Reference file ${name} uploaded successfully`);
    } catch (error) {
      console.error('Reference File Upload Error:', error);
      toast.error(
        `Error uploading reference file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const performBackfill = () => {
    if (
      !(
        workingMatchField &&
        referenceMatchField &&
        workingFillField &&
        referenceFillField
      )
    ) {
      toast.error('Please select all fields for backfilling');
      return;
    }

    const backfilledContent = workingFileContent.map(workingRow => {
      const matchValue = getValueByPath(workingRow, workingMatchField);
      const normalizedMatchValue = normalizeString(matchValue as string);

      // Check if the fill field is empty
      const currentFillValue = getValueByPath(workingRow, workingFillField);
      const isEmptyValue =
        currentFillValue === undefined ||
        currentFillValue === null ||
        (typeof currentFillValue === 'string' && currentFillValue.trim() === '') ||
        (Array.isArray(currentFillValue) && currentFillValue.length === 0) ||
        (typeof currentFillValue === 'object' &&
          currentFillValue !== null &&
          Object.keys(currentFillValue).length === 0);

      // Only backfill if the current value is empty
      if (isEmptyValue) {
        // Find matching reference row using normalized comparison
        const matchingReferenceRow = referenceFileContent.find(
          refRow => normalizeString(getValueByPath(refRow, referenceMatchField) as string) === normalizedMatchValue
        );

        if (matchingReferenceRow) {
          const fillValue = getValueByPath(matchingReferenceRow, referenceFillField);
          return {
            ...workingRow,
            [workingFillField]: fillValue
          };
        }
      }

      return workingRow;
    });

    // Create a download link
    const backfilledOutput = jsonToCsv(backfilledContent);
    const blob = new Blob([backfilledOutput], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backfilled_${workingFileName}`;
    a.click();
    window.URL.revokeObjectURL(url);

    // Count how many rows were actually backfilled
    const backfilledRowCount = backfilledContent.filter(
      row => getValueByPath(row, workingFillField) !==
           getValueByPath(workingFileContent.find(
             orig => normalizeString(getValueByPath(orig, workingMatchField) as string) ===
                     normalizeString(getValueByPath(row, workingMatchField) as string)
           ) || {},
           workingFillField)
    ).length;

    toast.success(`Backfilled ${backfilledRowCount} rows`);
  };

  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>Backfill</Header.Title>
        <Header.Description>
          Backfill data from one file into another
        </Header.Description>
      </Header>
      <Separator className='my-14 h-[1px]' />

      <div className='grid grid-cols-2 gap-8'>
        <div>
          <h3 className='text-lg font-semibold mb-4'>Working File</h3>
          <FileUpload onFileUpload={handleWorkingFileUpload} />
          {workingFileName && (
            <div className='mt-4'>
              <div className='flex gap-4 mb-4'>
                <div className='flex flex-col gap-2 w-full'>
                  <label htmlFor='matchField' className='text-sm font-medium'>
                    Match Field
                  </label>
                  <Select
                    value={workingMatchField}
                    onValueChange={setWorkingMatchField}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select match field...' />
                    </SelectTrigger>
                    <SelectContent>
                      {workingFileSchema.map(field => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex flex-col gap-2 w-full'>
                  <label htmlFor='fillField' className='text-sm font-medium'>
                    Fill Field
                  </label>
                  <Select value={workingFillField} onValueChange={setWorkingFillField}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select fill field...' />
                    </SelectTrigger>
                    <SelectContent>
                      {workingFileSchema.map(field => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className='text-lg font-semibold mb-4'>Reference File</h3>
          <FileUpload onFileUpload={handleReferenceFileUpload} />
          {referenceFileName && (
            <div className='mt-4'>
              <div className='flex gap-4 mb-4'>
                <div className='flex flex-col gap-2 w-full'>
                  <label htmlFor='matchField' className='text-sm font-medium'>
                    Match Field
                  </label>
                  <Select
                    value={referenceMatchField}
                    onValueChange={setReferenceMatchField}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select match field...' />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceFileSchema.map(field => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex flex-col gap-2 w-full'>
                  <label htmlFor='fillField' className='text-sm font-medium'>
                    Fill Field
                  </label>
                  <Select
                    value={referenceFillField}
                    onValueChange={setReferenceFillField}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select fill field...' />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceFileSchema.map(field => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {workingFileName && referenceFileName && (
        <div className='mt-8'>
          <Button
            onClick={performBackfill}
            disabled={
              !(
                workingMatchField &&
                referenceMatchField &&
                workingFillField &&
                referenceFillField
              )
            }
          >
            Perform Backfill
          </Button>
        </div>
      )}
    </div>
  );
}
