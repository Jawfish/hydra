import {
  countCsvRows,
  csvToJson,
  flattenObject,
  getAllPaths,
  getValueByPath,
  jsonlToJson,
  normalizeString,
  parseJson,
  serializeJson
} from '@/lib/parse';
import type { FileType } from '@/store/store';
import { describe, expect, it } from 'vitest';
describe('CSV counting', () => {
  it('counts single row in csv file', () => {
    const singleRowCsv = 'name,age\nJohn,30';

    const rowCount = countCsvRows(singleRowCsv);

    expect(rowCount).toBe(1);
  });

  it('counts multiple rows in csv file', () => {
    const multiRowCsv = 'name,age\nJohn,30\nJane,25\nBob,35';

    const rowCount = countCsvRows(multiRowCsv);

    expect(rowCount).toBe(3);
  });

  it('ignores empty lines when counting rows', () => {
    const csvWithEmptyLines = 'name,age\nJohn,30\n\nJane,25\n\n';

    const rowCount = countCsvRows(csvWithEmptyLines);

    expect(rowCount).toBe(2);
  });
});

describe('Special character handling', () => {
  it('handles UTF-8 characters in CSV', () => {
    const csvWithUtf8 = 'name,city\nJosé,São Paulo\nMarie,Münich';
    const parsed = csvToJson(csvWithUtf8);

    expect(parsed).toEqual([
      { name: 'José', city: 'São Paulo' },
      { name: 'Marie', city: 'Münich' }
    ]);
  });

  it('handles escaped characters in JSON', () => {
    const jsonWithEscapes = '[{"name":"Line\\nBreak","path":"C:\\\\Windows"}]';
    const parsed = parseJson(jsonWithEscapes);

    expect(parsed).toEqual([
      {
        name: 'Line\nBreak',
        path: 'C:\\Windows'
      }
    ]);
  });

  it('handles emoji and special characters', () => {
    const data = [
      { name: '👨‍💻 John', status: '✅' },
      { name: '👩‍🔬 Jane', status: '⭐' }
    ];

    const serialized = serializeJson(data, 'json');
    const parsed = parseJson(serialized);

    expect(parsed).toEqual(data);
  });
});

describe('Special character handling', () => {
  it('handles UTF-8 characters in CSV', () => {
    const csvWithUtf8 = 'name,city\nJosé,São Paulo\nMarie,Münich';
    const parsed = csvToJson(csvWithUtf8);

    expect(parsed).toEqual([
      { name: 'José', city: 'São Paulo' },
      { name: 'Marie', city: 'Münich' }
    ]);
  });

  it('handles escaped characters in JSON', () => {
    const jsonWithEscapes = '[{"name":"Line\\nBreak","path":"C:\\\\Windows"}]';
    const parsed = parseJson(jsonWithEscapes);

    expect(parsed).toEqual([
      {
        name: 'Line\nBreak',
        path: 'C:\\Windows'
      }
    ]);
  });

  it('handles emoji and special characters', () => {
    const data = [
      { name: '👨‍💻 John', status: '✅' },
      { name: '👩‍🔬 Jane', status: '⭐' }
    ];

    const serialized = serializeJson(data, 'json');
    const parsed = parseJson(serialized);

    expect(parsed).toEqual(data);
  });
});

describe('CSV parsing edge cases', () => {
  it('handles CSV with a single header row and no data', () => {
    const csvWithOnlyHeader = 'name,age';

    const parsed = csvToJson(csvWithOnlyHeader);

    expect(parsed).toEqual([]);
  });

  it('handles CSV with multiple empty rows', () => {
    const csvWithEmptyRows = 'name,age\n\n\n\nJohn,30\n\nJane,25\n\n';

    const parsed = csvToJson(csvWithEmptyRows);

    expect(parsed).toEqual([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ]);
  });

  it('handles CSV with rows containing only null or empty values', () => {
    const csvWithEmptyValues = 'name,age\n,\nJohn,30\n,\nJane,25\n,,';

    const parsed = csvToJson(csvWithEmptyValues);

    expect(parsed).toEqual([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ]);
  });
});

describe('Converting CSV to an array of objects', () => {
  it('successfully converts csv rows into objects', () => {
    const csv = 'name,age\nJohn,30\nJane,25';

    const parsed = csvToJson(csv);

    expect(parsed).toEqual([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ]);
  });

  it('preserves the type of the values', () => {
    const csv = 'name,age\nJohn,"30"\nJane,25\nBob,35.5\nAlice,true';

    const parsed = csvToJson(csv);

    expect(parsed).toEqual([
      // Not sure how to type a quoted number as a string
      // { name: 'John', age: '30' },
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
      { name: 'Bob', age: 35.5 },
      { name: 'Alice', age: true }
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(csvToJson('')).toEqual([]);
  });

  it('returns empty array if csv has no data', () => {
    const emptyCsv = 'name,age';

    const parsed = csvToJson(emptyCsv);

    expect(parsed).toEqual([]);
  });

  it('preserves quoted values with commas', () => {
    const csvWithQuotes =
      'name,description\nJohn,"Software engineer, senior"\nJane,"Product manager, tech"';

    const parsed = csvToJson(csvWithQuotes);

    expect(parsed).toEqual([
      { name: 'John', description: 'Software engineer, senior' },
      { name: 'Jane', description: 'Product manager, tech' }
    ]);
  });

  it('outputs same structure as jsonl parser', () => {
    const jsonlContent = '{"name":"John","age":30}\n{"name":"Jane","age":25}';
    const csvContent = 'name,age\nJohn,30\nJane,25';

    const jsonlParsed = jsonlToJson(jsonlContent);
    const csvParsed = csvToJson(csvContent);

    expect(csvParsed).toStrictEqual(jsonlParsed);
  });
});

describe('Serializing JSON', () => {
  // Normalize line breaks to '\n' for comparison
  const normalizeLineBreaks = (str: string): string =>
    str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  it('converts array of objects into csv string', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ];

    const csv = serializeJson(data);
    const expectedCsv = 'name,age\nJohn,30\nJane,25';

    expect(normalizeLineBreaks(csv)).toBe(normalizeLineBreaks(expectedCsv));
  });

  it('preserves the type of the values', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
      { name: 'Bob', age: 35.5 },
      { name: 'Alice', age: true }
    ];

    const csv = serializeJson(data);
    const expectedCsv = 'name,age\nJohn,30\nJane,25\nBob,35.5\nAlice,true';

    expect(normalizeLineBreaks(csv)).toBe(normalizeLineBreaks(expectedCsv));
  });

  it('preserves quoted values with commas', () => {
    const data = [
      { name: 'John', description: 'Software engineer, senior' },
      { name: 'Jane', description: 'Product manager, tech' }
    ];

    const csv = serializeJson(data);
    const expectedCsv =
      'name,description\nJohn,"Software engineer, senior"\nJane,"Product manager, tech"';

    expect(normalizeLineBreaks(csv)).toBe(normalizeLineBreaks(expectedCsv));
  });

  it('flattens nested objects into csv', () => {
    const data = [
      { name: 'John', age: 30, address: { city: 'New York', state: 'NY' } },
      { name: 'Jane', age: 25, address: { city: 'San Francisco', state: 'CA' } }
    ];

    const csv = serializeJson(data);
    const expectedCsv =
      'name,age,address.city,address.state\nJohn,30,New York,NY\nJane,25,San Francisco,CA';

    expect(normalizeLineBreaks(csv)).toBe(normalizeLineBreaks(expectedCsv));
  });

  it('preserves JSON format when original type is JSON', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ];

    const serialized = serializeJson(data, 'json');

    // Expect pretty-printed JSON
    expect(serialized).toBe(JSON.stringify(data, null, 2));
  });

  it('preserves JSONL format when original type is JSONL', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ];

    const serialized = serializeJson(data, 'jsonl');

    // Expect newline-separated JSON strings
    expect(serialized).toBe('{"name":"John","age":30}\n{"name":"Jane","age":25}');
  });

  it('defaults to CSV when no type is specified', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ];

    const serialized = serializeJson(data);

    // Expect CSV format
    expect(normalizeLineBreaks(serialized)).toBe(
      normalizeLineBreaks('name,age\nJohn,30\nJane,25')
    );
  });

  it('handles nested objects in all formats', () => {
    const data = [
      {
        name: 'John',
        address: {
          city: 'New York',
          state: 'NY'
        }
      }
    ];

    const jsonSerialized = serializeJson(data, 'json');
    const jsonlSerialized = serializeJson(data, 'jsonl');
    const csvSerialized = serializeJson(data, 'csv');

    // JSON: Pretty-printed with nested structure
    expect(JSON.parse(jsonSerialized)).toEqual([
      {
        name: 'John',
        address: {
          city: 'New York',
          state: 'NY'
        }
      }
    ]);

    // JSONL: Single line with nested object
    expect(jsonlSerialized).toBe(
      '{"name":"John","address":{"city":"New York","state":"NY"}}'
    );

    // CSV: Flattened with dot notation
    expect(normalizeLineBreaks(csvSerialized)).toBe(
      normalizeLineBreaks('name,address.city,address.state\nJohn,New York,NY')
    );
  });

  it('throws error for unsupported file types', () => {
    const data = [{ name: 'John' }];

    expect(() => serializeJson(data, 'unknown' as FileType)).toThrow(
      'Unsupported file type: unknown'
    );
  });
});

describe('JSONL parsing', () => {
  it('parses simple jsonl content into objects', () => {
    const jsonl = '{"name":"John"}\n{"name":"Jane"}';

    const parsed = jsonlToJson(jsonl);

    expect(parsed).toEqual([{ name: 'John' }, { name: 'Jane' }]);
  });

  it('removes byte order mark from beginning of content', () => {
    const jsonlWithBom = '\uFEFF{"name":"John"}\n{"name":"Jane"}';

    const parsed = jsonlToJson(jsonlWithBom);

    expect(parsed).toEqual([{ name: 'John' }, { name: 'Jane' }]);
  });

  it('normalizes windows line endings to unix style', () => {
    const jsonlWithCrlf = '{"name":"John"}\r\n{"name":"Jane"}';

    const parsed = jsonlToJson(jsonlWithCrlf);

    expect(parsed).toEqual([{ name: 'John' }, { name: 'Jane' }]);
  });
});

describe('Object path operations', () => {
  it('finds all top level paths in flat object', () => {
    const obj = { name: 'John', age: 30, city: 'New York' };

    const paths = getAllPaths(obj);

    expect(paths).toEqual(['name', 'age', 'city']);
  });

  it('finds nested paths in complex object', () => {
    const obj = {
      name: 'John',
      address: {
        street: 'Main St',
        city: 'New York',
        location: {
          lat: 40.7128,
          lng: -74.006
        }
      }
    };

    const paths = getAllPaths(obj);

    expect(paths).toEqual([
      'name',
      'address',
      'address.street',
      'address.city',
      'address.location',
      'address.location.lat',
      'address.location.lng'
    ]);
  });

  it('handles empty object when finding paths', () => {
    const obj = {};

    const paths = getAllPaths(obj);

    expect(paths).toEqual([]);
  });

  it('handles null and undefined values when finding paths', () => {
    const obj = {
      name: 'John',
      address: {
        city: null,
        street: undefined
      }
    };

    const paths = getAllPaths(obj);

    expect(paths).toEqual(['name', 'address', 'address.city', 'address.street']);
  });

  it('handles arrays when finding paths', () => {
    const obj = {
      names: ['John', 'Jane'],
      addresses: [{ city: 'New York' }]
    };

    const paths = getAllPaths(obj);

    expect(paths).toEqual(['names', 'addresses']);
  });
  it('handles empty values when finding paths', () => {
    const obj = {
      name: 'John',
      address: {}
    };

    const paths = getAllPaths(obj);

    expect(paths).toEqual(['name', 'address']);
  });

  it('skips array contents when finding paths', () => {
    const obj = {
      names: ['John', 'Jane'],
      addresses: [{ city: 'New York' }]
    };

    const paths = getAllPaths(obj);

    expect(paths).toEqual(['names', 'addresses']);
  });
});

describe('Value retrieval', () => {
  it('gets top level value from object', () => {
    const obj = { name: 'John', age: 30 };

    const value = getValueByPath(obj, 'name');

    expect(value).toBe('John');
  });

  it('gets nested value using dot notation', () => {
    const obj = {
      user: {
        address: {
          city: 'New York'
        }
      }
    };

    const value = getValueByPath(obj, 'user.address.city');

    expect(value).toBe('New York');
  });

  it('returns undefined for nonexistent path', () => {
    const obj = { name: 'John' };

    const value = getValueByPath(obj, 'address.city');

    expect(value).toBeUndefined();
  });

  it('returns undefined for intermediate null values', () => {
    const obj = {
      user: null
    };

    const value = getValueByPath(obj, 'user.name');

    expect(value).toBeUndefined();
  });
});

describe('Object flattening', () => {
  it('keeps flat objects unchanged', () => {
    const input = { name: 'John', age: 30 };

    const flattened = flattenObject(input);

    expect(flattened).toEqual({
      name: 'John',
      age: 30
    });
  });

  it('flattens single level nested object', () => {
    const input = {
      name: 'John',
      address: {
        city: 'New York',
        street: 'Broadway'
      }
    };

    const flattened = flattenObject(input);

    expect(flattened).toEqual({
      name: 'John',
      'address.city': 'New York',
      'address.street': 'Broadway'
    });
  });

  it('flattens multiple levels of nesting', () => {
    const input = {
      user: {
        name: 'John',
        address: {
          location: {
            city: 'New York',
            coords: {
              lat: 40.7128,
              lng: -74.006
            }
          }
        }
      }
    };

    const flattened = flattenObject(input);

    expect(flattened).toEqual({
      'user.name': 'John',
      'user.address.location.city': 'New York',
      'user.address.location.coords.lat': 40.7128,
      'user.address.location.coords.lng': -74.006
    });
  });

  it('preserves arrays as values without flattening their contents', () => {
    const input = {
      name: 'John',
      hobbies: ['reading', 'swimming'],
      addresses: [{ city: 'New York' }, { city: 'London' }]
    };

    const flattened = flattenObject(input);

    expect(flattened).toEqual({
      name: 'John',
      hobbies: ['reading', 'swimming'],
      addresses: [{ city: 'New York' }, { city: 'London' }]
    });
  });

  it('handles null and undefined values', () => {
    const input = {
      name: 'John',
      address: {
        city: null,
        street: undefined,
        country: {
          code: null,
          name: undefined
        }
      }
    };

    const flattened = flattenObject(input);

    expect(flattened).toEqual({
      name: 'John',
      'address.city': null,
      'address.street': undefined,
      'address.country.code': null,
      'address.country.name': undefined
    });
  });

  it('preserves non-object values in nested structures', () => {
    const input = {
      metrics: {
        count: 42,
        isActive: true,
        label: 'test'
      }
    };

    const flattened = flattenObject(input);

    expect(flattened).toEqual({
      'metrics.count': 42,
      'metrics.isActive': true,
      'metrics.label': 'test'
    });
  });
});

describe('JSON parsing error handling', () => {
  it('throws error for malformed JSON', () => {
    const malformedJson = '{"name": "John", unclosed: "quote}';
    expect(() => parseJson(malformedJson)).toThrow();
  });

  it('throws error for trailing comma', () => {
    const trailingCommaJson = '{"name": "John",}';
    expect(() => parseJson(trailingCommaJson)).toThrow();
  });

  it('throws error for missing quotes around property names', () => {
    const missingQuotesJson = '{name: "John"}';
    expect(() => parseJson(missingQuotesJson)).toThrow();
  });
});

describe('Serialization roundtrip tests', () => {
  it('preserves data through serialize-parse cycle for CSV', () => {
    const originalData = [
      { name: 'John', age: 30, nested: { city: 'NY' } },
      { name: 'Jane', age: 25, nested: { city: 'SF' } }
    ];

    const serialized = serializeJson(originalData, 'csv');
    const parsed = csvToJson(serialized);

    expect(parsed).toEqual([
      { name: 'John', age: 30, 'nested.city': 'NY' },
      { name: 'Jane', age: 25, 'nested.city': 'SF' }
    ]);
  });

  it('preserves data through serialize-parse cycle for JSON', () => {
    const originalData = [
      { name: 'John', nested: { deep: { value: 42 } } },
      { name: 'Jane', nested: { deep: { value: 43 } } }
    ];

    const serialized = serializeJson(originalData, 'json');
    const parsed = parseJson(serialized);

    expect(parsed).toEqual(originalData);
  });

  it('preserves data through serialize-parse cycle for JSONL', () => {
    const originalData = [
      { name: 'John', complex: { array: [1, 2, 3], null: null } },
      { name: 'Jane', complex: { array: [4, 5, 6], null: null } }
    ];

    const serialized = serializeJson(originalData, 'jsonl');
    const parsed = jsonlToJson(serialized);

    expect(parsed).toEqual(originalData);
  });
});

describe('JSON parsing error handling', () => {
  it('throws error for malformed JSON', () => {
    const malformedJson = '{"name": "John", unclosed: "quote}';
    expect(() => parseJson(malformedJson)).toThrow();
  });

  it('throws error for trailing comma', () => {
    const trailingCommaJson = '{"name": "John",}';
    expect(() => parseJson(trailingCommaJson)).toThrow();
  });

  it('throws error for missing quotes around property names', () => {
    const missingQuotesJson = '{name: "John"}';
    expect(() => parseJson(missingQuotesJson)).toThrow();
  });
});

describe('Serialization roundtrip tests', () => {
  it('preserves data through serialize-parse cycle for CSV', () => {
    const originalData = [
      { name: 'John', age: 30, nested: { city: 'NY' } },
      { name: 'Jane', age: 25, nested: { city: 'SF' } }
    ];

    const serialized = serializeJson(originalData, 'csv');
    const parsed = csvToJson(serialized);

    expect(parsed).toEqual([
      { name: 'John', age: 30, 'nested.city': 'NY' },
      { name: 'Jane', age: 25, 'nested.city': 'SF' }
    ]);
  });

  it('preserves data through serialize-parse cycle for JSON', () => {
    const originalData = [
      { name: 'John', nested: { deep: { value: 42 } } },
      { name: 'Jane', nested: { deep: { value: 43 } } }
    ];

    const serialized = serializeJson(originalData, 'json');
    const parsed = parseJson(serialized);

    expect(parsed).toEqual(originalData);
  });

  it('preserves data through serialize-parse cycle for JSONL', () => {
    const originalData = [
      { name: 'John', complex: { array: [1, 2, 3], null: null } },
      { name: 'Jane', complex: { array: [4, 5, 6], null: null } }
    ];

    const serialized = serializeJson(originalData, 'jsonl');
    const parsed = jsonlToJson(serialized);

    expect(parsed).toEqual(originalData);
  });
});

describe('JSON parsing', () => {
  it('parses standard JSON array', () => {
    const jsonContent = '[{"name":"John"},{"name":"Jane"}]';

    const parsed = parseJson(jsonContent);

    expect(parsed).toEqual([{ name: 'John' }, { name: 'Jane' }]);
  });

  it('parses single object as array', () => {
    const jsonContent = '{"name":"John"}';

    const parsed = parseJson(jsonContent);

    expect(parsed).toEqual([{ name: 'John' }]);
  });

  it('handles object with numeric keys', () => {
    const jsonContent = '{"0":{"name":"John"},"1":{"name":"Jane"}}';

    const parsed = parseJson(jsonContent);

    expect(parsed).toEqual([{ name: 'John' }, { name: 'Jane' }]);
  });

  it('handles mixed numeric and non-numeric keys', () => {
    const jsonContent = `{
      "0": {"name": "John"},
      "1": {"name": "Jane"},
      "metadata": {"total": 2}
    }`;

    const parsed = parseJson(jsonContent);

    expect(parsed).toEqual([{ name: 'John' }, { name: 'Jane' }]);
  });

  it('handles nested objects', () => {
    const jsonContent = '{"users":[{"name":"John"},{"name":"Jane"}]}';

    const parsed = parseJson(jsonContent);

    expect(parsed).toEqual([{ users: [{ name: 'John' }, { name: 'Jane' }] }]);
  });

  it('throws error for invalid JSON', () => {
    const invalidJson = '{invalid json}';

    expect(() => parseJson(invalidJson)).toThrow();
  });

  it('handles empty array', () => {
    const emptyArrayJson = '[]';

    const parsed = parseJson(emptyArrayJson);

    expect(parsed).toEqual([]);
  });

  it('handles empty object', () => {
    const emptyObjectJson = '{}';

    const parsed = parseJson(emptyObjectJson);

    expect(parsed).toEqual([{}]);
  });

  it('preserves primitive values', () => {
    const primitiveJson = '"hello"';

    const parsed = parseJson(primitiveJson);

    expect(parsed).toEqual(['hello']);
  });

  it('handles nested objects with numeric keys', () => {
    const nestedNumericJson = '{"data":{"0":{"name":"John"},"1":{"name":"Jane"}}}';

    const parsed = parseJson(nestedNumericJson);

    expect(parsed).toEqual([
      {
        data: {
          '0': { name: 'John' },
          '1': { name: 'Jane' }
        }
      }
    ]);
  });
});

describe('String normalization', () => {
  it('converts string to lowercase', () => {
    const input = 'HELLO World';

    const normalized = normalizeString(input);

    expect(normalized).toBe('hello world');
  });

  it('replaces special characters with spaces', () => {
    const input = 'hello@world#how$are%you';

    const normalized = normalizeString(input);

    expect(normalized).toBe('hello world how are you');
  });

  it('removes duplicate spaces', () => {
    const input = 'hello   world     test';

    const normalized = normalizeString(input);

    expect(normalized).toBe('hello world test');
  });

  it('trims spaces from ends', () => {
    const input = '  hello world  ';

    const normalized = normalizeString(input);

    expect(normalized).toBe('hello world');
  });

  it('handles null input', () => {
    const normalized = normalizeString(null);

    expect(normalized).toBe('');
  });

  it('handles undefined input', () => {
    const normalized = normalizeString(undefined);

    expect(normalized).toBe('');
  });

  it('converts non-string inputs to strings', () => {
    const cases = [
      { input: 42, expected: '42' },
      { input: true, expected: 'true' },
      { input: { toString: (): string => 'object' }, expected: 'object' }
    ];

    for (const { input, expected } of cases) {
      const normalized = normalizeString(input as unknown as string);
      expect(normalized).toBe(expected);
    }
  });

  it('handles combined normalization cases', () => {
    const input = '  HELLO@world##HOW   are   YOU!  ';

    const normalized = normalizeString(input);

    expect(normalized).toBe('hello world how are you');
  });
});
