import { toast } from 'sonner';
import type { FileType } from '@/store/store';
import { useReferenceFileStore, useWorkingFileStore } from '@/store/store';

export function useFileUpload(
  storeType: 'working' | 'reference'
): (name: string, content: string, fileType: string) => void {
  const store = storeType === 'working' ? useWorkingFileStore : useReferenceFileStore;

  const handleFileUpload = (name: string, content: string, fileType: string): void => {
    try {
      console.debug(`Uploading ${storeType} File:`, {
        name,
        fileType,
        contentLength: content.length
      });

      store.getState().setFileName(name);

      store.getState().setFileContent(content, fileType as FileType);

      toast.success(
        `${storeType.charAt(0).toUpperCase() + storeType.slice(1)} file uploaded successfully`
      );
    } catch (error) {
      console.error(
        `${storeType.charAt(0).toUpperCase() + storeType.slice(1)} File Upload Error:`,
        error
      );
      toast.error(
        `Error uploading ${storeType} file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return handleFileUpload;
}
