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
          try {
            console.debug(`Setting file content for ${fileType}`);
            console.debug('Raw content length:', content.length);
            
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
              try {
                console.debug('Raw JSON content length:', content.length);
                console.debug('Raw JSON preview:', content.slice(0, 200));
                
                const parsedContent = JSON.parse(content);
                console.debug('Parsed JSON type:', typeof parsedContent);
                console.debug('Parsed JSON keys:', Object.keys(parsedContent));
                
                // Check if it's an object with numeric keys that looks like an array
                if (typeof parsedContent === 'object' && !Array.isArray(parsedContent)) {
                  const numericKeys = Object.keys(parsedContent).filter(key => !isNaN(Number(key)));
                  if (numericKeys.length > 0) {
                    // Convert object to array
                    state.fileContentParsed = numericKeys.map(key => parsedContent[key]);
                  } else {
                    // If not array-like, wrap in an array
                    state.fileContentParsed = [parsedContent];
                  }
                } else {
                  // Normal array case
                  state.fileContentParsed = Array.isArray(parsedContent) 
                    ? parsedContent 
                    : [parsedContent];
                }
                
                console.debug('JSON parsed:', state.fileContentParsed.length + ' rows');
                console.debug('First row:', state.fileContentParsed[0]);
              } catch (error) {
                console.error('JSON Parse error:', error);
                console.error('Problematic content:', content.slice(0, 500)); // Show first 500 chars
                throw error;
              }
              break;
            default:
              throw new Error(`Unsupported file type: ${fileType}`);
          }
          console.debug('Parse complete', {
            parsedType: typeof state.fileContentParsed,
            parsedLength: state.fileContentParsed.length
          });
          } catch (error) {
            console.error('Comprehensive parse error:', {
              error,
              fileType,
              contentStart: content.slice(0, 500),
              contentLength: content.length
            });
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
