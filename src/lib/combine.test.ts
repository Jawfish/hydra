import { type FileInfo, combineFiles } from '@/lib/combine';
import { describe, expect, it } from 'vitest';

describe('combineFiles', () => {
  it('properly merges entries with same ID across files', () => {
    const files: FileInfo[] = [
      {
        id: crypto.randomUUID(),
        fileName: 'file1.json',
        content: [{ id: '1', name: 'John', age: 30 }],
        idField: 'id'
      },
      {
        id: crypto.randomUUID(),
        fileName: 'file2.json',
        content: [{ id: '1', location: 'NY', name: 'John' }],
        idField: 'id'
      }
    ];

    const result = combineFiles(files);
    expect(result.combined).toEqual([
      {
        name: 'John',
        age: 30,
        location: 'NY'
      }
    ]);
    expect(result.warnings).toHaveLength(0);
  });

  it('handles missing ID fields', () => {
    const files: FileInfo[] = [
      {
        id: crypto.randomUUID(),
        fileName: 'file1.json',
        content: [{ id: '1', name: 'John' }, { name: 'Jane' }],
        idField: 'id'
      },
      {
        id: crypto.randomUUID(),
        fileName: 'file2.json',
        content: [{ id: '1', age: 30 }],
        idField: 'id'
      }
    ];

    const result = combineFiles(files);
    expect(result.warnings).toContain(
      'Missing Prompt ID field "id" in entry from file1.json'
    );
  });

  it('throws error on value conflicts', () => {
    const files: FileInfo[] = [
      {
        id: crypto.randomUUID(),
        fileName: 'file1.json',
        content: [{ id: '1', name: 'John' }],
        idField: 'id'
      },
      {
        id: crypto.randomUUID(),
        fileName: 'file2.json',
        content: [{ id: '1', name: 'Jane' }],
        idField: 'id'
      }
    ];

    expect(() => combineFiles(files)).toThrow(
      'Conflict detected: Field "name" has different values for Prompt ID "1"'
    );
  });

  it('handles ID fields that contain spaces', () => {
    const files: FileInfo[] = [
      {
        id: crypto.randomUUID(),
        fileName: 'file1.json',
        content: [{ 'User ID': '1', name: 'John' }],
        idField: 'User ID'
      },
      {
        id: crypto.randomUUID(),
        fileName: 'file2.json',
        content: [{ 'User ID': '1', age: 30 }],
        idField: 'User ID'
      }
    ];

    const result = combineFiles(files);
    expect(result.combined).toEqual([
      {
        name: 'John',
        age: 30
      }
    ]);
    expect(result.warnings).toHaveLength(0);
  });
});
