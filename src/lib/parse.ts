import type { FileType } from '@/store/store';
import Papa from 'papaparse';
const BOM_REGEX = /^\uFEFF/;
const CRLF_REGEX = /\r\n/g;

/**
 * Safely parses JSONL content and returns valid JSON objects
 * @param {string} content - Raw JSONL content
 * @returns {Record<string, unknown>[]} Array of parsed JSON objects
 */
export const jsonlToJson = (content: string): Record<string, unknown>[] => {
  return content
    .replace(BOM_REGEX, '') // Remove byte order mark
    .replace(CRLF_REGEX, '\n') // Normalize line endings
    .split('\n') // Split the input string by newline characters
    .filter(line => line.trim() !== '') // Remove any empty lines
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSON on line ${index + 1}: ${line}: ${error}`);
      }
    });
};

/**
 * Gets all possible paths in a nested object
 * @param obj - The object to get paths from
 * @param prefix - Current path prefix (used in recursion)
 * @returns Array of paths (e.g., ["name", "address.street", "address.city"])
 */
export const getAllPaths = (obj: object, prefix = ''): string[] => {
  console.debug('Getting paths for object:', obj);
  let paths: string[] = [];

  if (!obj || typeof obj !== 'object') {
    console.debug('Invalid object for path generation');
    return paths;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as { [key: string]: unknown })[key];
      const newPath = prefix ? `${prefix}.${key}` : key;

      paths.push(newPath);

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        paths = paths.concat(getAllPaths(value, newPath));
      }
    }
  }

  console.debug('Generated paths:', paths);
  return paths;
};

/**
 * Gets a value from an object using a dot-notation path
 * @param obj - The object to get the value from
 * @param path - The path to the value (e.g., "address.street")
 * @returns The value at the path, or undefined if not found
 */
export const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
  return path
    .split('.')
    .reduce(
      (current, part) =>
        (current as Record<string, unknown>)?.[part] as Record<string, unknown>,
      obj as Record<string, unknown>
    );
};

/**
 * Convert CSV content into an array of objects
 * @param {string} csv - CSV content to parse
 * @returns {Record<string, unknown>[]} - Array of objects representing the CSV data
 */
export const csvToJson = (csv: string): Record<string, unknown>[] => {
  if (!csv.trim()) {
    return [];
  }
  // Include header row to return an array of objects keyed by header names
  const result = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    dynamicTyping: true
  }).data;

  if (!result || result.length === 0) {
    return [];
  }

  return result;
};

/**
 * Flattens a nested object into a single-level object with dot notation
 * @param {object} obj - Object to flatten
 * @param {string} [prefix=''] - Prefix for nested keys
 * @returns {object} Flattened object
 */
export const flattenObject = (
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> => {
  return Object.keys(obj).reduce((acc: Record<string, unknown>, key: string) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Recursively flatten nested objects
      const flattened = flattenObject(obj[key] as Record<string, unknown>, prefixedKey);
      for (const key in flattened) {
        if (Object.prototype.hasOwnProperty.call(flattened, key)) {
          acc[key] = flattened[key];
        }
      }
      return acc;
    }

    acc[prefixedKey] = obj[key];
    return acc;
  }, {});
};

/**
 * Convert an array of objects into a CSV string, handling nested objects
 * @param {Record<string, unknown>[]} data - Array of objects to convert to CSV
 * @returns {string} - CSV string
 */
export const serializeJson = (
  data: Record<string, unknown>[],
  originalFileType: FileType = 'csv'
): string => {
  switch (originalFileType) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'jsonl':
      return data.map(item => JSON.stringify(item)).join('\n');
    case 'csv':
      return Papa.unparse(
        data.map(item => flattenObject(item)),
        { header: true }
      );
    default:
      throw new Error(`Unsupported file type: ${originalFileType}`);
  }
};

/**
 * Count the number of rows in a CSV file
 * @param csvContent - String containing CSV data
 * @returns Number of rows in the CSV content
 */
export const countCsvRows = (csvContent: string): number =>
  // Subtract 1 to account for the header row
  Papa.parse(csvContent, { skipEmptyLines: true }).data.length - 1;
export function normalizeString(s: string | null | undefined): string {
  if (!s) {
    return '';
  }

  // Convert to string in case we get a number or other type
  const str = String(s);

  return (
    str
      // Convert to lowercase
      .toLowerCase()
      // Replace special characters with spaces
      .replace(/[^\w\s]/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Trim spaces from ends
      .trim()
  );
}

/**
 * Parse JSON content so that it can be used as an array of objects
 * @param {string} content - Raw JSON content
 * @returns {Record<string, unknown>[]} - Array of parsed JSON objects
 */
export const parseJson = (content: string): Record<string, unknown>[] => {
  const parsedContent = JSON.parse(content);

  if (typeof parsedContent === 'object' && !Array.isArray(parsedContent)) {
    const numericKeys = Object.keys(parsedContent).filter(
      key => !Number.isNaN(Number(key))
    );
    if (numericKeys.length > 0) {
      return numericKeys.map(key => parsedContent[key]);
    }
    return [parsedContent];
  }

  return Array.isArray(parsedContent) ? parsedContent : [parsedContent];
};
