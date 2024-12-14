import { countCsvRows } from '@/lib/parse';
import { jsonlToJson } from '@/lib/parse';
import { useWorkingFileStore } from '@/store/store';

export function Metadata() {
  const { fileContentRaw, fileContentParsed, fileName } = useWorkingFileStore();

  const getCount = () => {
    return fileContentParsed.length;
  };

  const count = getCount();

  return (
    <>
      {fileName && (
        <p className='text-sm text-muted-foreground mt-2'>
          {fileName.endsWith('.csv')
            ? `CSV file contains ${count} data rows`
            : `File contains ${count} objects`}
        </p>
      )}
    </>
  );
}
