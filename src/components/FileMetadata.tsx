import { countCSVRows } from '@/lib/csv';
import { parseJSONL } from '@/lib/jsonl';

interface FileMetadataProps {
  fileType: 'csv' | 'jsonl' | null;
  fileContent: string;
}

export function FileMetadata({ fileType, fileContent }: FileMetadataProps) {
  if (!fileType || !fileContent) return null;

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

  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">
        {fileType === 'csv' 
          ? `CSV file contains ${count} data rows`
          : `JSONL file contains ${count} objects`}
      </p>
    </div>
  );
}
