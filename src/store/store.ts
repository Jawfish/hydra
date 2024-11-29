import { create } from 'zustand';

interface FileState {
  input: string;
  extractedUUIDs: string[];
  fileError: string | null;
  jsonlSchema: string[];
  csvHeaders: string[];
  selectedField: string;
  fileContent: string;
  fileType: 'csv' | 'jsonl' | null;
  
  // Actions
  setInput: (input: string) => void;
  setExtractedUUIDs: (uuids: string[]) => void;
  setFileError: (error: string | null) => void;
  setJsonlSchema: (schema: string[]) => void;
  setCsvHeaders: (headers: string[]) => void;
  setSelectedField: (field: string) => void;
  setFileContent: (content: string) => void;
  setFileType: (type: 'csv' | 'jsonl' | null) => void;
  resetFileState: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  input: '',
  extractedUUIDs: [],
  fileError: null,
  jsonlSchema: [],
  csvHeaders: [],
  selectedField: '',
  fileContent: '',
  fileType: null,

  // Actions
  setInput: (input) => set({ input }),
  setExtractedUUIDs: (extractedUUIDs) => set({ extractedUUIDs }),
  setFileError: (fileError) => set({ fileError }),
  setJsonlSchema: (jsonlSchema) => set({ jsonlSchema }),
  setCsvHeaders: (csvHeaders) => set({ csvHeaders }),
  setSelectedField: (selectedField) => set({ selectedField }),
  setFileContent: (fileContent) => set({ fileContent }),
  setFileType: (fileType) => set({ fileType }),
  resetFileState: () => set({
    input: '',
    extractedUUIDs: [],
    fileError: null,
    jsonlSchema: [],
    csvHeaders: [],
    selectedField: '',
    fileContent: '',
    fileType: null,
  }),
}));
