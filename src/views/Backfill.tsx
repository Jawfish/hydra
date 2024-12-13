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
    console.log('Working File Content Changed:', {
      fileName: workingFileName,
      contentLength: workingFileContent.length,
      firstRow: workingFileContent[0]
    });
  }, [workingFileContent, workingFileName]);

  useEffect(() => {
    console.log('Reference File Content Changed:', {
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
      console.log('Uploading Working File:', { name, fileType, contentLength: content.length });
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
      console.log('Uploading Reference File:', { name, fileType, contentLength: content.length });
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

      // Find matching reference row
      const matchingReferenceRow = referenceFileContent.find(
        refRow => getValueByPath(refRow, referenceMatchField) === matchValue
      );

      if (matchingReferenceRow) {
        const fillValue = getValueByPath(matchingReferenceRow, referenceFillField);
        return {
          ...workingRow,
          [workingFillField]: fillValue
        };
      }

      return workingRow;
    });

    // Optionally convert back to CSV if original was CSV
    const backfilledOutput = jsonToCsv(backfilledContent);

    // Create a download link
    const blob = new Blob([backfilledOutput], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backfilled_${workingFileName}`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Backfilled ${backfilledContent.length} rows`);
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
        <div className='mt-8 flex justify-center'>
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

      {/* Debug Information */}
      <div className='mt-4 p-4 bg-gray-100 rounded'>
        <h4 className='font-bold'>Debug Information</h4>
        <p>Working File: {workingFileName || 'Not uploaded'}</p>
        <p>Working File Content Length: {workingFileContent.length}</p>
        <p>Working File Schema Length: {workingFileSchema.length}</p>
        <p>Reference File: {referenceFileName || 'Not uploaded'}</p>
        <p>Reference File Content Length: {referenceFileContent.length}</p>
        <p>Reference File Schema Length: {referenceFileSchema.length}</p>
      </div>
    </div>
  );
}
