import { analyzeField, analyzeFieldDetails } from '@/lib/fileAnalysis';
import { describe, expect, it } from 'vitest';

describe('Field Analysis', () => {
  describe('Basic Field Analysis', () => {
    it('correctly counts non-empty and empty values', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: '', age: null },
        { name: null, age: 25 },
        { name: undefined, age: undefined }
      ];

      const analysis = analyzeField(data, 'name');

      expect(analysis).toEqual({
        name: 'name',
        nonEmptyCount: 1,
        emptyCount: 3,
        uniqueValues: 1
      });
    });

    it('handles fields with periods in their names', () => {
      const data = [
        { 'user.name': 'John', 'user.age': 30 },
        { 'user.name': '', 'user.age': null },
        { 'user.name': 'Jane', 'user.age': 25 }
      ];

      const analysis = analyzeField(data, 'user.name');

      expect(analysis).toEqual({
        name: 'user.name',
        nonEmptyCount: 2,
        emptyCount: 1,
        uniqueValues: 2
      });
    });

    it('handles nested objects', () => {
      const data = [
        { user: { name: 'John' } },
        { user: { name: '' } },
        { user: { name: 'Jane' } }
      ];

      const analysis = analyzeField(data, 'user.name');

      expect(analysis).toEqual({
        name: 'user.name',
        nonEmptyCount: 2,
        emptyCount: 1,
        uniqueValues: 2
      });
    });

    it('counts unique values correctly', () => {
      const data = [
        { name: 'John' },
        { name: 'John' },
        { name: 'Jane' },
        { name: 'John' }
      ];

      const analysis = analyzeField(data, 'name');

      expect(analysis).toEqual({
        name: 'name',
        nonEmptyCount: 4,
        emptyCount: 0,
        uniqueValues: 2
      });
    });
  });

  describe('Field Analysis Details', () => {
    it('identifies empty fields with identifier', () => {
      const data = [
        { id: '1', name: 'John' },
        { id: '2', name: '' },
        { id: '3', name: null },
        { id: '4', name: undefined }
      ];

      const details = analyzeFieldDetails(data, 'name', 'id');

      expect(details).toEqual([
        { identifier: '2', value: '', isEmpty: true },
        { identifier: '3', value: '', isEmpty: true },
        { identifier: '4', value: '', isEmpty: true }
      ]);
    });

    it('handles nested field identifiers', () => {
      const data = [
        { user: { id: '1' }, name: 'John' },
        { user: { id: '2' }, name: '' },
        { user: { id: '3' }, name: null }
      ];

      const details = analyzeFieldDetails(data, 'name', 'user.id');

      expect(details).toEqual([
        { identifier: '2', value: '', isEmpty: true },
        { identifier: '3', value: '', isEmpty: true }
      ]);
    });

    it('handles complex empty value scenarios', () => {
      const data = [
        { id: '1', details: {} },
        { id: '2', details: { value: '' } },
        { id: '3', details: { value: null } },
        { id: '4', details: { value: [] } },
        { id: '5', details: { value: {} } }
      ];

      const details = analyzeFieldDetails(data, 'details.value', 'id');

      expect(details).toEqual([
        { identifier: '1', value: '', isEmpty: true },
        { identifier: '2', value: '', isEmpty: true },
        { identifier: '3', value: '', isEmpty: true },
        { identifier: '4', value: '', isEmpty: true },
        { identifier: '5', value: '', isEmpty: true }
      ]);
    });

    it('handles missing parameters gracefully', () => {
      const data = [{ name: 'John' }];

      const details1 = analyzeFieldDetails([], 'name', 'id');
      const details2 = analyzeFieldDetails(data, '', 'id');
      const details3 = analyzeFieldDetails(data, 'name', '');

      expect(details1).toEqual([]);
      expect(details2).toEqual([]);
      expect(details3).toEqual([]);
    });
  });
});
