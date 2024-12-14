import { ActionSection } from '@/components/ActionSection';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getAllPaths, normalizeString, serializeJson } from '@/lib/parse';
import { getValueByPath } from '@/lib/parse';
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

const createReferenceValueSet = (
  referenceFileContent: Record<string, unknown>[],
  referenceMatchField: string
): Set<string> => {
  return new Set(
    referenceFileContent.map(row =>
      normalizeString(getValueByPath(row, referenceMatchField) as string)
    )
  );
};

const filterOutDuplicates = (
  workingFileContent: Record<string, unknown>[],
  workingMatchField: string,
  referenceValues: Set<string>
): Record<string, unknown>[] => {
  return workingFileContent.filter(
    row =>
      !referenceValues.has(
        normalizeString(getValueByPath(row, workingMatchField) as string)
      )
  );
};

const downloadFilteredFile = (
  result: Record<string, unknown>[],
  workingFileName: string | null
): void => {
  const fileType = (workingFileName?.split('.').pop() as FileType) || 'csv';
  const output = serializeJson(result, fileType);
  const blob = new Blob([output], {
    type:
      fileType === 'json'
        ? 'application/json'
        : fileType === 'jsonl'
          ? 'application/jsonl'
          : 'text/csv'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `deduplicated_${timestamp}.${fileType}`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export function Deduplicate() {
  const { fileName: workingFileName, fileContentParsed: workingFileContent } =
    useWorkingFileStore();

  const { fileName: referenceFileName, fileContentParsed: referenceFileContent } =
    useReferenceFileStore();

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
    // Validation checks
    if (!(workingFileName && referenceFileName)) {
      toast.error('Please upload both files');
      return;
    }

    if (!(workingMatchField && referenceMatchField)) {
      toast.error('Please select match fields for both files');
      return;
    }

    try {
      const referenceValues = createReferenceValueSet(
        referenceFileContent,
        referenceMatchField
      );

      const originalCount = workingFileContent.length;
      const result = filterOutDuplicates(
        workingFileContent,
        workingMatchField,
        referenceValues
      );
      const finalCount = result.length;

      downloadFilteredFile(result, workingFileName);

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
        <ActionSection>
          <ActionSection.Button
            onClick={processDeduplicate}
            disabled={!(workingMatchField && referenceMatchField)}
          >
            Process Deduplication
          </ActionSection.Button>
        </ActionSection>
      )}
    </div>
  );
}
