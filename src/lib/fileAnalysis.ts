import { getValueByPath } from './parse';

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

export const analyzeField = (data: Record<string, unknown>[], field: string): FieldAnalysis => {
  const uniqueValues = new Set();
  let nonEmptyCount = 0;
  let emptyCount = 0;

  for (const row of data) {
    const value = typeof row === 'object' ? getValueByPath(row, field) : row[field];
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
    console.log('analyzeFieldDetails: Missing required parameters', { data: !!data, field, identifierField });
    return [];
  }

  console.log('analyzeFieldDetails: Starting analysis', {
    totalRows: data.length,
    field,
    identifierField
  });

  const details: FieldAnalysisDetail[] = [];
  for (const row of data) {
    const fieldValue = getValueByPath(row, field);
    const identifier = getValueByPath(row, identifierField);

    const stringValue = String(fieldValue ?? '').trim();
    const isEmpty = stringValue === '' || fieldValue === null || fieldValue === undefined;

    details.push({
      identifier: String(identifier),
      value: isEmpty ? '' : stringValue,
      isEmpty
    });
  }

  const emptyDetails = details.filter(d => d.isEmpty);
  console.log('analyzeFieldDetails: Analysis complete', {
    totalAnalyzed: details.length,
    emptyCount: emptyDetails.length,
    sampleEmpty: emptyDetails.slice(0, 2)
  });

  return emptyDetails;
};
