import { getValueByPath } from '@/lib/parse';
import Papa from 'papaparse';

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
 * Validates if a normalized string is a valid UUID
 * @param normalized - Normalized potential UUID string
 * @returns boolean indicating if the string is a valid UUID
 */
const isValidUuid = (normalized: string): boolean =>
  normalized.length === 36 && UUID_REGEX.test(normalized);

/**
 * Filters an array of candidates to only valid UUIDs
 * @param candidates - Array of potential UUID strings
 * @returns Array of valid UUID strings
 */
const filterValidUuiDs = (candidates: string[]): string[] =>
  candidates.filter(candidate => isValidUuid(candidate));

/**
 * Main function that extracts valid UUIDs from a text string
 * @param text - The input text to search for UUIDs
 * @returns An array of valid UUID strings found in the text
 */
export const extractUuids = (text: string): string[] => {
  const processed = processText(text);
  const candidates = getCandidates(processed);
  return filterValidUuiDs(candidates);
};

/**
 * Extracts UUIDs from the ID field of JSONL content
 * @param jsonlContent - String containing JSONL data
 * @returns Array of valid UUIDs found in ID fields
 */
export const extractUuidsFromJsonl = (
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

  return extractUuids(idValues.join(' '));
};

/**
 * Extracts UUIDs from the ID column of CSV content
 * @param csvContent - String containing CSV data
 * @returns Array of valid UUIDs found in ID column
 */
export const extractUuidsFromCsv = (
  csvContent: string,
  columnName: string
): string[] => {
  const parsedContent = Papa.parse(csvContent, { header: true });

  const idValues = (parsedContent.data as Record<string, string>[]).map(
    row => row[columnName] || ''
  );

  return extractUuids(idValues.join(' '));
};
