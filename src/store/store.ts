import { create } from 'zustand';

interface FileState {
  input: string;
  extractedUuids: string[];
  fileError: string | null;
  fileName: string | null;
  jsonlSchema: string[];
  csvHeaders: string[];
  selectedField: string;
  fileContent: string;
  fileType: 'csv' | 'jsonl' | null;

  setInput: (input: string) => void;
  setExtractedUuids: (uuids: string[]) => void;
  setFileError: (error: string | null) => void;
  setFileName: (name: string | null) => void;
  setJsonlSchema: (schema: string[]) => void;
  setCsvHeaders: (headers: string[]) => void;
  setSelectedField: (field: string) => void;
  setFileContent: (content: string) => void;
  setFileType: (type: 'csv' | 'jsonl' | null) => void;
  resetFileState: () => void;
}

export const useFileStore = create<FileState>(set => ({
  input: '',
  extractedUuids: [],
  fileError: null,
  fileName: null,
  jsonlSchema: [],
  csvHeaders: [],
  selectedField: '',
  fileContent: '',
  fileType: null,

  setInput: input => set({ input }),
  setExtractedUuids: extractedUuiDs => set({ extractedUuids: extractedUuiDs }),
  setFileError: fileError => set({ fileError }),
  setFileName: fileName => set({ fileName }),
  setJsonlSchema: jsonlSchema => set({ jsonlSchema }),
  setCsvHeaders: csvHeaders => set({ csvHeaders }),
  setSelectedField: selectedField => set({ selectedField }),
  setFileContent: fileContent => set({ fileContent }),
  setFileType: fileType => set({ fileType }),
  resetFileState: () =>
    set({
      input: '',
      extractedUuids: [],
      fileError: null,
      fileName: null,
      jsonlSchema: [],
      csvHeaders: [],
      selectedField: '',
      fileContent: '',
      fileType: null
    })
}));
