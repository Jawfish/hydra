import { useFileUpload } from '@/hooks/use-file-upload';
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
import { getAllPaths, jsonToCsv, normalizeString } from '@/lib/parse';
import { getValueByPath } from '@/lib/parse';
import { useReferenceFileStore, useWorkingFileStore } from '@/store/store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function Deduplicate() {
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

  const processDeduplicate = () => {
    if (!(workingFileName && referenceFileName)) {
      toast.error('Please upload both files');
      return;
    }

    if (!(workingMatchField && referenceMatchField)) {
      toast.error('Please select match fields for both files');
      return;
    }

    try {
      console.time('deduplicate');

      // Create set of normalized reference values
      console.time('reference-set');
      const referenceValues = new Set(
        referenceFileContent.map(row =>
          normalizeString(getValueByPath(row, referenceMatchField) as string)
        )
      );
      console.timeEnd('reference-set');

      // Filter working file
      console.time('filter');
      const originalCount = workingFileContent.length;
      const result = workingFileContent.filter(
        row =>
          !referenceValues.has(
            normalizeString(getValueByPath(row, workingMatchField) as string)
          )
      );
      const finalCount = result.length;
      console.timeEnd('filter');

      // Create download
      console.time('download');
      const fileType = workingFileName?.split('.').pop() as FileType || 'csv';
      const output = jsonToCsv(result, fileType);
      const blob = new Blob([output], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `deduplicated_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      console.timeEnd('download');

      console.timeEnd('deduplicate');
      toast.success(
        `Removed ${originalCount - finalCount} duplicate ${
          originalCount - finalCount === 1 ? 'entry' : 'entries'
        }`
      );
    } catch (error) {
      console.error('Deduplication Error:', error);
      toast.error(
        `Error processing files: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>Deduplicate Files</Header.Title>
        <Header.Description>
          Remove entries from a file if they match values in another file
        </Header.Description>
      </Header>

      <div className='grid grid-cols-2 gap-8'>
        <div>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>Working File</h3>
            <p className='text-muted-foreground text-sm'>
              The file to remove duplicates from
            </p>
          </div>
          <FileUpload
            onFileUpload={handleWorkingFileUpload}
            fileName={workingFileName}
          />
          {workingFileName && (
            <div className='mt-4'>
              <div className='flex flex-col gap-2'>
                <label htmlFor='matchField' className='text-sm font-medium'>
                  Field to match on
                </label>
                <Select value={workingMatchField} onValueChange={setWorkingMatchField}>
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
            </div>
          )}
        </div>

        <div>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>Reference File</h3>
            <p className='text-muted-foreground text-sm'>
              The file to check for duplicates against
            </p>
          </div>
          <FileUpload
            onFileUpload={handleReferenceFileUpload}
            fileName={referenceFileName}
          />
          {referenceFileName && (
            <div className='mt-4'>
              <div className='flex flex-col gap-2'>
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
            </div>
          )}
        </div>
      </div>

      {workingFileName && referenceFileName && (
        <div className='mt-8'>
          <Button
            onClick={processDeduplicate}
            disabled={!(workingMatchField && referenceMatchField)}
          >
            Process Deduplication
          </Button>
        </div>
      )}
    </div>
  );
}
