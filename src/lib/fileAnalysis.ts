import { getValueByPath } from '@/lib/parse';

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
    // Prefer direct access first, fallback to getValueByPath only if direct access fails
    const value = row[field] !== undefined ? row[field] : getValueByPath(row, field);

    const stringValue = String(value).trim();

    if (stringValue === '' || value === null || value === undefined) {
      emptyCount++;
    } else {
      nonEmptyCount++;
      uniqueValues.add(stringValue);
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
