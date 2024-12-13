import { csvToJson, jsonlToJson } from '@/lib/parse';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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

const createFileStore = () =>
  create<FileStore>()(
    immer(set => ({
      ...initialState,
      setFileName: name => {
        set(state => {
          console.debug(`Setting file name to ${name}`);
          state.fileName = name;
        });
      },
      setFileContent: (content, fileType) => {
        set(state => {
          console.debug(`Setting file content for ${fileType}`);
          state.fileContentRaw = content;
          
          console.debug('Parsing content...');
          try {
            switch (fileType) {
            case 'jsonl':
              state.fileContentParsed = jsonlToJson(content);
              console.debug('JSONL parsed:', state.fileContentParsed.length, 'rows');
              break;
            case 'csv':
              state.fileContentParsed = csvToJson(content);
              console.debug('CSV parsed:', state.fileContentParsed.length, 'rows');
              break;
            case 'json':
              state.fileContentParsed = JSON.parse(content);
              console.debug('JSON parsed:', Array.isArray(state.fileContentParsed) ? state.fileContentParsed.length + ' rows' : 'object');
              break;
            default:
              throw new Error(`Unsupported file type: ${fileType}`);
          }
          console.debug('Parse complete');
          } catch (error) {
            console.error('Parse error:', error);
            throw error;
          }
        });
      },
      resetFileState: () => {
        set(() => initialState);
      }
    }))
  );

export const useWorkingFileStore = createFileStore();
export const useReferenceFileStore = createFileStore();
