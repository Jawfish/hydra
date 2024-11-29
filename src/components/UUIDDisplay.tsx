import { Button } from '@/components/ui/button';
import { useFileStore } from '@/store/store';
import { toast } from 'sonner';

export function UUIDDisplay() {
  const { extractedUUIDs } = useFileStore();

  const handleCopy = (listType: 'python' | 'plaintext') => {
    if (!extractedUUIDs.length) {
      toast.warning('No UUIDs to copy');
      return;
    }

    try {
      if (listType === 'python') {
        navigator.clipboard.writeText(
          `[${extractedUUIDs.map(uuid => `'${uuid}'`).join(', ')}]`
        );
      } else {
        navigator.clipboard.writeText(extractedUUIDs.join('\n'));
      }

      toast.success(`Copied ${extractedUUIDs.length} UUIDs to clipboard`);
    } catch (error) {
      toast.error(
        `Error copying to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      {extractedUUIDs.length > 0 && (
        <div className='flex gap-2'>
          <Button
            variant='secondary'
            className='w-min'
            onClick={() => handleCopy('python')}
          >
            Copy as Python list
          </Button>
          <Button
            variant='secondary'
            className='w-min'
            onClick={() => handleCopy('plaintext')}
          >
            Copy as plain text
          </Button>
        </div>
      )}
    </div>
  );
}
