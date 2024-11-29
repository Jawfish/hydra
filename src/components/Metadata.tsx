import { countCSVRows } from '@/lib/csv';
import { parseJSONL } from '@/lib/jsonl';
import { useFileStore } from '@/store/store';

export function Metadata() {
  const { fileType, fileContent, extractedUUIDs } = useFileStore();

  const getCount = () => {
    if (fileType === 'csv') {
      // Subtract 1 to exclude header row
      return countCSVRows(fileContent) - 1;
    } else {
      // For JSONL, count valid JSON objects
      return parseJSONL(fileContent).length;
    }
  };

  const count = getCount();

  const shouldDisplay = fileContent || extractedUUIDs.length > 0;

  if (!shouldDisplay) return null;

  return (
    <div className='rounded-md border p-4'>
      {fileContent && (
        <p className='text-sm text-muted-foreground'>
          {fileType === 'csv'
            ? `CSV file contains ${count} data rows`
            : `JSONL file contains ${count} objects`}
        </p>
      )}
      {extractedUUIDs.length > 0 && (
        <p className='text-sm text-muted-foreground'>
          {`Found ${extractedUUIDs.length} UUIDs`}
        </p>
      )}
    </div>
  );
}
