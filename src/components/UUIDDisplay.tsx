import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

interface UUIDDisplayProps {
  uuids: string[];
}

export function UUIDDisplay({ uuids }: UUIDDisplayProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(uuids.join('\n'));
      toast({
        title: 'Copied to clipboard'
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
      <h2 className='text-lg font-medium'>Extracted UUIDs ({uuids.length})</h2>
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
      <Button variant='secondary' className='w-min' onClick={handleCopy}>
        Copy
      </Button>
    </div>
  );
}
