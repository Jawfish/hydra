import { ActionSection } from '@/components/ActionSection';
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
    <ActionSection>
      {extractedUuids.length > 0 && (
        <div className='flex gap-2'>
          <ActionSection.Button onClick={() => handleCopy('python')}>
            Copy as Python list
          </ActionSection.Button>
          <ActionSection.Button
            onClick={() => handleCopy('plaintext')}
            variant='outline'
          >
            Copy as plain text
          </ActionSection.Button>
        </div>
      )}
    </ActionSection>
  );
}
