import { type FileType, useWorkingFileStore } from '@/store/store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { serializeJson } from '@/lib/parse';
import { useState } from 'react';
import { toast } from 'sonner';

export function WorkingFileDownloader() {
  const { fileName, fileContentParsed } = useWorkingFileStore();
  const [selectedFormat, setSelectedFormat] = useState<FileType>('csv');

  const handleDownload = () => {
    if (fileContentParsed.length === 0) {
      return;
    }

    try {
      const output = serializeJson(fileContentParsed, selectedFormat);
      const blob = new Blob([output], {
        type:
          selectedFormat === 'json'
            ? 'application/json'
            : selectedFormat === 'jsonl'
              ? 'application/jsonl'
              : 'text/csv'
      });
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
    <div className='fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-center space-x-4 shadow-lg z-50'>
      <div className='flex items-center space-x-2'>
        <span className='text-sm text-muted-foreground'>Convert to:</span>
        <Select
          value={selectedFormat}
          onValueChange={(value: string) => setSelectedFormat(value as FileType)}
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
