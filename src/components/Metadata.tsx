import { useWorkingFileStore } from '@/store/store';

export function Metadata() {
  const { fileContentParsed, fileName } = useWorkingFileStore();

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
