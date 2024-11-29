import Papa from 'papaparse';

/**
 * Count the number of rows in a CSV file
 * @param csvContent - String containing CSV data
 * @returns Number of rows in the CSV content
 */
export const countCsvRows = (csvContent: string): number =>
  Papa.parse(csvContent, { skipEmptyLines: true }).data.length;
