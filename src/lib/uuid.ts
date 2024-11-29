import { getValueByPath } from '@/lib/jsonl';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_VALID_CHARS = /[0-9a-f-]/i;

/**
 * Replaces all invalid UUID characters with spaces
 * @param char - Single character to check
 * @returns The character if valid, space if invalid
 */
const replaceInvalidChar = (char: string): string =>
  UUID_VALID_CHARS.test(char) ? char : ' ';

/**
 * Processes text by replacing invalid UUID characters with spaces
 * @param text - Input text to process
 * @returns Processed text with invalid characters replaced by spaces
 */
const processText = (text: string): string =>
  text.split('').map(replaceInvalidChar).join('');

/**
 * Splits processed text into potential UUID candidates
 * @param processedText - Text with invalid characters replaced by spaces
 * @returns Array of non-empty strings that might be UUIDs
 */
const getCandidates = (processedText: string): string[] =>
  processedText.split(' ').filter(s => s.length > 0);

/**
 * Normalizes a potential UUID string by handling hyphens
 * @param candidate - Potential UUID string
 * @returns Normalized string with correct hyphen placement
 */
const normalizeUUID = (candidate: string): string => {
  const trimmed = candidate.replace(/^-+|-+$/g, '');
  return trimmed.replace(/-+/g, '-');
};

/**
 * Validates if a normalized string is a valid UUID
 * @param normalized - Normalized potential UUID string
 * @returns boolean indicating if the string is a valid UUID
 */
const isValidUUID = (normalized: string): boolean =>
  normalized.length === 36 && UUID_REGEX.test(normalized);

/**
 * Filters an array of candidates to only valid UUIDs
 * @param candidates - Array of potential UUID strings
 * @returns Array of valid UUID strings
 */
const filterValidUUIDs = (candidates: string[]): string[] =>
  candidates.filter(candidate => isValidUUID(normalizeUUID(candidate)));

/**
 * Main function that extracts valid UUIDs from a text string
 * @param text - The input text to search for UUIDs
 * @returns An array of valid UUID strings found in the text
 */
export const extractUUIDs = (text: string): string[] => {
  const processed = processText(text);
  const candidates = getCandidates(processed);
  return filterValidUUIDs(candidates);
};

/**
 * Extracts UUIDs from the ID field of JSONL content
 * @param jsonlContent - String containing JSONL data
 * @returns Array of valid UUIDs found in ID fields
 */
export const extractUUIDsFromJSONL = (
  jsonlContent: string,
  fieldPath: string
): string[] => {
  const lines = jsonlContent.split('\n').filter(line => line.trim());

  const idValues = lines.map(line => {
    try {
      const parsed = JSON.parse(line);
      const value = getValueByPath(parsed, fieldPath);
      return value?.toString() || '';
    } catch (_) {
      return '';
    }
  });

  return extractUUIDs(idValues.join(' '));
};

/**
 * Extracts UUIDs from the ID column of CSV content
 * @param csvContent - String containing CSV data
 * @returns Array of valid UUIDs found in ID column
 */
export const extractUUIDsFromCSV = (
  csvContent: string,
  columnName: string
): string[] => {
  const lines = csvContent
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(header => header.trim());
  const columnIndex = headers.findIndex(header => header === columnName);

  if (columnIndex === -1) return [];

  const idValues = lines.slice(1).map(line => {
    const columns = line.split(',').map(col => col.trim());
    return columns[columnIndex] || '';
  });

  return extractUUIDs(idValues.join(' '));
};
