export type FileInfo = {
  id: string;
  fileName: string | null;
  content: Record<string, unknown>[];
  idField: string;
  prefix?: string;
};

type MergedEntry = {
  data: Record<string, unknown>;
  sources: Map<string, string>;
};

export type CombineResult = {
  combined: Record<string, unknown>[];
  warnings: string[];
};

function validateAndGetId(
  entry: Record<string, unknown>,
  file: FileInfo,
  warnings: string[]
): string | null {
  const idValue: unknown = entry[file.idField];
  if (idValue === undefined || idValue === null || idValue === '') {
    warnings.push(
      `Missing Prompt ID field "${file.idField}" in entry from ${file.fileName}`
    );
    return null;
  }
  return String(idValue);
}

function handleFieldConflict(
  key: string,
  value: unknown,
  existingValue: unknown,
  existingSource: string | undefined,
  filePrefix: string,
  mergedEntry: MergedEntry,
  idStr: string
): void {
  const existingPrefixed = existingSource ? `${existingSource} ${key}` : key;
  const newPrefixed = filePrefix ? `${filePrefix} ${key}` : key;

  if (existingPrefixed !== key) {
    mergedEntry.data[existingPrefixed] = existingValue;
    delete mergedEntry.data[key];
    mergedEntry.sources.delete(key);
  }

  if (!mergedEntry.data[newPrefixed]) {
    mergedEntry.data[newPrefixed] = value;
    mergedEntry.sources.set(newPrefixed, filePrefix);
  } else if (mergedEntry.data[newPrefixed] !== value) {
    throw new Error(
      `Conflict detected: Field "${key}" has different values for Prompt ID "${idStr}". Specify unique prefixes to prepend to conflicting fields.`
    );
  }
}

function processField(
  key: string,
  value: unknown,
  idField: string,
  filePrefix: string,
  mergedEntry: MergedEntry,
  idStr: string
): void {
  if (key === idField) {
    return;
  }

  const existingValue = mergedEntry.data[key];
  const existingSource = mergedEntry.sources.get(key);

  if (existingValue === undefined) {
    mergedEntry.data[key] = value;
    mergedEntry.sources.set(key, filePrefix);
  } else if (existingValue !== value) {
    handleFieldConflict(
      key,
      value,
      existingValue,
      existingSource,
      filePrefix,
      mergedEntry,
      idStr
    );
  }
}

function processFileEntry(
  entry: Record<string, unknown>,
  file: FileInfo,
  mergedMap: Map<string, MergedEntry>,
  warnings: string[]
): void {
  const idStr = validateAndGetId(entry, file, warnings);
  if (!idStr) {
    return;
  }

  const mergedEntry = mergedMap.get(idStr) || {
    data: {},
    sources: new Map()
  };

  for (const [key, value] of Object.entries(entry)) {
    processField(key, value, file.idField, file.prefix || '', mergedEntry, idStr);
  }

  mergedMap.set(idStr, mergedEntry);
}

export function combineFiles(files: FileInfo[]): CombineResult {
  const warnings: string[] = [];
  const mergedMap = new Map<string, MergedEntry>();

  for (const file of files) {
    for (const entry of file.content) {
      processFileEntry(entry, file, mergedMap, warnings);
    }
  }

  return {
    combined: Array.from(mergedMap.values()).map(e => e.data),
    warnings
  };
}
