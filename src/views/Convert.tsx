import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { parseJsonl } from '@/lib/json';
import { useFileStore } from '@/store/store';
import Papa from 'papaparse';
import { toast } from 'sonner';

export function Convert() {
  const { fileType, fileContent } = useFileStore();

  const convertToCsv = () => {
    if (!fileContent || fileType !== 'jsonl') {
      toast.error('Please upload a JSONL file first');
      return;
    }

    try {
      // Parse JSONL content
      const objects = parseJsonl(fileContent);

      // Extract all unique keys by flattening the objects
      const flattenedObjects = objects.map(obj => {
        const flattened: Record<string, unknown> = {};
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This is not very complex
        const flatten = (obj: Record<string, unknown>, prefix = '') => {
          for (const key in obj) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (value && typeof value === 'object' && !Array.isArray(value)) {
              flatten(value as Record<string, unknown>, newKey);
            } else {
              flattened[newKey] = value;
            }
          }
        };
        flatten(obj);
        return flattened;
      });

      // Convert to CSV
      const csv = Papa.unparse(flattenedObjects);

      // Download the CSV file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `converted_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Successfully converted JSONL to CSV!');
    } catch (error) {
      toast.error(
        `Error converting file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>Convert</Header.Title>
        <Header.Description>Convert JSON to or from CSV</Header.Description>
      </Header>

      <FileUpload />

      <Separator className='my-14 h-[1px]' />
      <div className='flex flex-col gap-4 max-w-min'>
        <Button onClick={convertToCsv}>Convert</Button>
      </div>
    </div>
  );
}
