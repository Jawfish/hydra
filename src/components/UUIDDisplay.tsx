import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFileStore } from '@/store/store';

export function UUIDDisplay() {
  const { toast } = useToast();
  const { extractedUUIDs } = useFileStore();

  const handleCopy = (listType: 'python' | 'plaintext') => {
    if (!extractedUUIDs.length) {
      toast({
        title: 'No UUIDs to copy',
        variant: 'destructive'
      });
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

      toast({
        title: `Copied ${extractedUUIDs.length} UUIDs to clipboard`
      });
    } catch (error) {
      toast({
        title: 'Error copying to clipboard',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
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
