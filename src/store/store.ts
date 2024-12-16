import { getParsedContentFromFile } from '@/lib/parse';
import { type StoreApi, type UseBoundStore, create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
// import type { WithImmer } from 'zustand/middleware';

export type FileType = 'jsonl' | 'csv' | 'json' | 'unknown';

type FileState = {
  fileName: string | null;
  fileContentRaw: string;
  fileContentParsed: Record<string, unknown>[];
};

type FileActions = {
  setFileName: (name: string | null) => void;
  setFileContent: (content: string, fileType: FileType) => void;
  resetFileState: () => void;
};

type FileStore = FileState & FileActions;

const initialState: FileState = {
  fileName: null,
  fileContentRaw: '',
  fileContentParsed: []
};

const createFileStore = (): UseBoundStore<StoreApi<FileStore>> =>
  create<FileStore>()(
    immer(set => ({
      ...initialState,
      setFileName: (name): void => {
        set((state): void => {
          console.debug(`Setting file name to ${name}`);
          state.fileName = name;
        });
      },
      setFileContent: (content, fileType): void => {
        set(state => {
          console.debug(`Setting file content for ${fileType}`);

          state.fileName = state.fileName || 'Unnamed File';
          state.fileContentRaw = content;

          try {
            state.fileContentParsed = getParsedContentFromFile(content, fileType);
            console.debug('Parse complete', {
              parsedType: typeof state.fileContentParsed,
              parsedLength: state.fileContentParsed.length
            });
          } catch (error) {
            console.error('Parse error:', {
              error,
              fileType,
              contentStart: content.slice(0, 500),
              contentLength: content.length
            });
            throw error;
          }
        });
      },
      resetFileState: (): void => {
        set(() => initialState);
      }
    }))
  );

export const useWorkingFileStore = createFileStore();
export const useReferenceFileStore = createFileStore();
