import { countCsvRows } from '@/lib/csv';
import { parseJsonl } from '@/lib/jsonl';
import { useFileStore } from '@/store/store';

export function Metadata() {
  const { fileType, fileContent, extractedUuids } = useFileStore();

  const getCount = () => {
    if (fileType === 'csv') {
      // Subtract 1 to exclude header row
      return countCsvRows(fileContent) - 1;
    }
    // For JSONL, count valid JSON objects
    return parseJsonl(fileContent).length;
  };

  const count = getCount();

  return (
    <>
      {fileContent && (
        <p className='text-sm text-muted-foreground mt-2'>
          {fileType === 'csv'
            ? `CSV file contains ${count} data rows`
            : `JSONL file contains ${count} objects`}
        </p>
      )}
      {extractedUuids.length > 0 && (
        <p className='text-sm text-muted-foreground'>
          {`Found ${extractedUuids.length} UUIDs`}
        </p>
      )}
    </>
  );
}
