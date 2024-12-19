import { getValueByPath } from '@/lib/parse';

const isEmptyValue = (value: unknown): boolean => {
  const isNonEmptyObject =
    value instanceof Date || value instanceof RegExp || typeof value === 'function';

  return (
    !isNonEmptyObject &&
    (value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && value !== null && Object.keys(value).length === 0))
  );
};

const getStringValue = (value: unknown): string => {
  const isNonEmptyObject =
    value instanceof Date || value instanceof RegExp || typeof value === 'function';

  return isNonEmptyObject ? value.toString() : String(value).trim();
};

export interface FieldAnalysis {
  name: string;
  nonEmptyCount: number;
  emptyCount: number;
  uniqueValues: number;
}

export interface FieldAnalysisDetail {
  identifier: string;
  value: string;
  isEmpty: boolean;
}

export const analyzeField = (
  data: Record<string, unknown>[],
  field: string
): FieldAnalysis => {
  const uniqueValues = new Set();
  let nonEmptyCount = 0;
  let emptyCount = 0;

  for (const row of data) {
    // Guard against null, undefined, or non-object inputs
    if (row == null || typeof row !== 'object') {
      emptyCount++;
      continue;
    }

    // Prefer direct access first, fallback to getValueByPath only if direct access fails
    const value = row[field] !== undefined ? row[field] : getValueByPath(row, field);

    if (isEmptyValue(value)) {
      emptyCount++;
    } else {
      nonEmptyCount++;
      uniqueValues.add(getStringValue(value));
    }
  }

  return {
    name: field,
    nonEmptyCount,
    emptyCount,
    uniqueValues: uniqueValues.size
  };
};

export const analyzeFieldDetails = (
  data: Record<string, unknown>[],
  field: string,
  identifierField: string
): FieldAnalysisDetail[] => {
  if (!(data && field && identifierField)) {
    // biome-ignore lint/nursery/noSecrets: not a secret
    console.debug('analyzeFieldDetails: Missing required parameters', {
      data: !!data,
      field,
      identifierField
    });
    return [];
  }

  // biome-ignore lint/nursery/noSecrets: not a secret
  console.debug('analyzeFieldDetails: Starting analysis', {
    totalRows: data.length,
    field,
    identifierField
  });

  const details: FieldAnalysisDetail[] = [];
  for (const row of data) {
    const fieldValue = getValueByPath(row, field);
    const identifier = getValueByPath(row, identifierField);

    const isEmpty =
      fieldValue === undefined ||
      fieldValue === null ||
      (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
      (Array.isArray(fieldValue) && fieldValue.length === 0) ||
      (typeof fieldValue === 'object' &&
        fieldValue !== null &&
        Object.keys(fieldValue).length === 0);

    details.push({
      identifier: String(identifier),
      value: isEmpty ? '' : String(fieldValue ?? ''),
      isEmpty
    });
  }

  const emptyDetails = details.filter(d => d.isEmpty);
  // biome-ignore lint/nursery/noSecrets: not a secret
  console.debug('analyzeFieldDetails: Analysis complete', {
    totalAnalyzed: details.length,
    emptyCount: emptyDetails.length,
    nonEmptyCount: details.length - emptyDetails.length
  });

  return emptyDetails;
};
