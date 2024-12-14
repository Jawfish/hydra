import { useReferenceFileStore, useWorkingFileStore } from '@/store/store';
import type { FileType } from '@/store/store';
import { toast } from 'sonner';

export function useFileUpload(storeType: 'working' | 'reference') {
  const store = storeType === 'working' ? useWorkingFileStore : useReferenceFileStore;

  const handleFileUpload = (name: string, content: string, fileType: string) => {
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
