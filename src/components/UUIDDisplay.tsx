import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface UUIDDisplayProps {
  uuids: string[];
}

export function UUIDDisplay({ uuids }: UUIDDisplayProps) {
  const { toast } = useToast();

  const handleCopy = (listType: 'python' | 'plaintext') => {
    if (!uuids.length) {
      toast({
        title: 'No UUIDs to copy',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (listType === 'python') {
        navigator.clipboard.writeText(`[${uuids.map(uuid => `'${uuid}'`).join(', ')}]`);
      } else {
        navigator.clipboard.writeText(uuids.join('\n'));
      }

      toast({
        title: `Copied ${uuids.length} UUIDs to clipboard`
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
      <h2 className='text-lg font-medium'>Extracted {uuids.length} UUIDs</h2>
      {uuids.length > 0 ? (
        <ScrollArea className='h-[200px] rounded-md border p-4 list-none'>
          {uuids.map((uuid, index) => (
            <li key={index} className='rounded p-2 font-mono'>
              {uuid}
            </li>
          ))}
        </ScrollArea>
      ) : (
        <p className='text-zinc-500'>No UUIDs found in the text</p>
      )}
      {uuids.length > 0 && (
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
