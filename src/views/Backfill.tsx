import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getAllPaths, normalizeString } from '@/lib/parse';
import { getValueByPath } from '@/lib/parse';
import { serializeJson } from '@/lib/parse';
import { Button } from '@/shadcn/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shadcn/components/ui/select';
import {
  type FileType,
  useReferenceFileStore,
  useWorkingFileStore
} from '@/store/store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function Backfill() {
  const { fileName: workingFileName, fileContentParsed: workingFileContent } =
    useWorkingFileStore();

  const { fileName: referenceFileName, fileContentParsed: referenceFileContent } =
    useReferenceFileStore();

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

  const handleWorkingFileUpload = useFileUpload('working');
  const handleReferenceFileUpload = useFileUpload('reference');

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

    console.time('backfill');

    // Precompute normalized reference values for faster matching
    console.time('reference-map');
    const normalizedReferenceMap = new Map(
      referenceFileContent.map(refRow => [
        normalizeString(getValueByPath(refRow, referenceMatchField) as string),
        refRow
      ])
    );
    console.timeEnd('reference-map');

    console.time('process-rows');
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
        // Use Map lookup instead of .find()
        const matchingReferenceRow = normalizedReferenceMap.get(normalizedMatchValue);

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
    console.timeEnd('process-rows');

    // Create a download link
    console.time('create-csv');
    const fileType = (workingFileName?.split('.').pop() as FileType) || 'csv';
    const backfilledOutput = serializeJson(backfilledContent, fileType);
    const blob = new Blob([backfilledOutput], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backfilled_${workingFileName}`;
    a.click();
    window.URL.revokeObjectURL(url);
    console.timeEnd('create-csv');

    // Count backfilled rows using the Map for consistent comparison
    console.time('count-backfilled');
    const backfilledRowCount = backfilledContent.filter(row => {
      const origValue = getValueByPath(row, workingFillField);
      const matchValue = normalizeString(
        getValueByPath(row, workingMatchField) as string
      );
      const referenceRow = normalizedReferenceMap.get(matchValue);
      return (
        referenceRow && origValue !== getValueByPath(referenceRow, referenceFillField)
      );
    }).length;
    console.timeEnd('count-backfilled');

    console.timeEnd('backfill');
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

      <div className='grid grid-cols-2 gap-8'>
        <div>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>Working File</h3>
            <p className='text-muted-foreground text-sm'>
              The file to backfill data into
            </p>
          </div>
          <FileUpload
            onFileUpload={handleWorkingFileUpload}
            fileName={workingFileName}
          />
          {workingFileName && (
            <div className='mt-4'>
              <div className='flex gap-4 mb-4'>
                <div className='flex flex-col gap-2 w-full'>
                  <label htmlFor='matchField' className='text-sm font-medium'>
                    Field to match on
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
                    Field to backfill data into
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
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>Reference File</h3>
            <p className='text-muted-foreground text-sm'>
              The file to retrieve data from
            </p>
          </div>
          <FileUpload
            onFileUpload={handleReferenceFileUpload}
            fileName={referenceFileName}
          />
          {referenceFileName && (
            <div className='mt-4'>
              <div className='flex gap-4 mb-4'>
                <div className='flex flex-col gap-2 w-full'>
                  <label htmlFor='matchField' className='text-sm font-medium'>
                    Field to match on
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
                    Field to retrieve data from
                  </label>
                  <Select
                    value={referenceFillField}
                    onValueChange={setReferenceFillField}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select data field...' />
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
