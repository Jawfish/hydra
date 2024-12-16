import { serializeJson } from '@/lib/parse';
import { Button } from '@/shadcn/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shadcn/components/ui/select';
import { type FileType, useWorkingFileStore } from '@/store/store';
import { useState } from 'react';
import type { JSX } from 'react';
import { toast } from 'sonner';

export function WorkingFileDownloader(): JSX.Element | null {
  const { fileName, fileContentParsed } = useWorkingFileStore();
  const [selectedFormat, setSelectedFormat] = useState<FileType>('csv');

  const handleDownload = (): void => {
    if (fileContentParsed.length === 0) {
      return;
    }

    try {
      const output = serializeJson(fileContentParsed, selectedFormat);
      let mimeType = 'text/csv';

      if (selectedFormat === 'json') {
        mimeType = 'application/json';
      } else if (selectedFormat === 'jsonl') {
        mimeType = 'application/jsonl';
      }

      const blob = new Blob([output], { type: mimeType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `converted_${timestamp}.${selectedFormat}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded file as ${selectedFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  // Only render if there's a file in the store
  if (!fileName || fileContentParsed.length === 0) {
    return null;
  }

  return (
    <div className='fixed right-0 bottom-0 left-0 z-50 flex items-center justify-center space-x-4 border-t bg-background p-4 shadow-lg'>
      <div className='flex items-center space-x-2'>
        <span className='text-muted-foreground text-sm'>Convert to:</span>
        <Select
          value={selectedFormat}
          onValueChange={(value: string): void => setSelectedFormat(value as FileType)}
        >
          <SelectTrigger className='w-[100px]'>
            <SelectValue placeholder='Format' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='csv'>CSV</SelectItem>
            <SelectItem value='json'>JSON</SelectItem>
            <SelectItem value='jsonl'>JSONL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleDownload}>Download Converted File</Button>
    </div>
  );
}
