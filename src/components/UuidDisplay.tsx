import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UuidDisplayProps {
  extractedUuids: string[];
}

export function UuidDisplay({ extractedUuids }: UuidDisplayProps) {
  const handleCopy = (listType: 'python' | 'plaintext') => {
    if (extractedUuids.length === 0) {
      toast.warning('No UUIDs to copy');
      return;
    }

    try {
      if (listType === 'python') {
        navigator.clipboard.writeText(
          `[${extractedUuids.map(uuid => `'${uuid}'`).join(', ')}]`
        );
      } else {
        navigator.clipboard.writeText(extractedUuids.join('\n'));
      }

      toast.success(`Copied ${extractedUuids.length} UUIDs to clipboard`);
    } catch (error) {
      toast.error(
        `Error copying to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='flex flex-col gap-6 mt-12 bg-muted p-6 -m-6 rounded-md'>
      {extractedUuids.length > 0 && (
        <div className='flex gap-2'>
          <Button className='w-min' onClick={() => handleCopy('python')}>
            Copy as Python list
          </Button>
          <Button
            variant='outline'
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
