/**
 * Safely parses JSONL content and returns valid JSON objects
 * @param content - Raw JSONL content
 * @returns Array of parsed JSON objects
 */
const BOM_REGEX = /^\uFEFF/;
const CRLF_REGEX = /\r\n/g;

export const parseJsonl = (content: string) => {
  const cleanContent = content.replace(BOM_REGEX, '').replace(CRLF_REGEX, '\n');

  return cleanContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return { valid: true, data: JSON.parse(line) };
      } catch (_) {
        return { valid: false, data: null };
      }
    })
    .filter(result => result.valid)
    .map(result => result.data);
};

/**
 * Gets all possible paths in a nested object
 * @param obj - The object to get paths from
 * @param prefix - Current path prefix (used in recursion)
 * @returns Array of paths (e.g., ["name", "address.street", "address.city"])
 */
export const getAllPaths = (obj: object, prefix = ''): string[] => {
  let paths: string[] = [];

  if (!obj || typeof obj !== 'object') {
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
