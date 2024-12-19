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

describe('Edge Cases and Performance', () => {
  it('handles mixed data types in the same field', () => {
    const data = [
      { value: 'string' },
      { value: 42 },
      { value: true },
      { value: { nested: 'object' } },
      { value: [1, 2, 3] }
    ];

    const analysis = analyzeField(data, 'value');
    expect(analysis.nonEmptyCount).toBe(5);
    expect(analysis.emptyCount).toBe(0);
    expect(analysis.uniqueValues).toBe(5);
  });

  it('handles numeric fields correctly', () => {
    const data = [{ count: 0 }, { count: 42 }, { count: -1 }, { count: 3.14 }];

    const analysis = analyzeField(data, 'count');
    expect(analysis.nonEmptyCount).toBe(4);
    expect(analysis.emptyCount).toBe(0);
    expect(analysis.uniqueValues).toBe(4);
  });

  it('handles boolean fields correctly', () => {
    const data = [
      { active: true },
      { active: false },
      { active: true },
      { active: null }
    ];

    const analysis = analyzeField(data, 'active');
    expect(analysis.nonEmptyCount).toBe(3);
    expect(analysis.emptyCount).toBe(1);
    expect(analysis.uniqueValues).toBe(2);
  });
});

describe('Error Handling and Edge Cases', () => {
  it('handles malformed input data gracefully', () => {
    const malformedData = [
      null as unknown,
      undefined as unknown,
      {} as Record<string, unknown>,
      { field: 'valid' }
    ];

    const analysis = analyzeField(malformedData, 'field');
    expect(analysis.nonEmptyCount).toBe(1);
    expect(analysis.emptyCount).toBe(3);
  });

  it('handles deeply nested objects without stack overflow', () => {
    const createDeepObject = (depth: number): Record<string, unknown> => {
      if (depth === 0) {
        return 'value';
      }
      return { nested: createDeepObject(depth - 1) };
    };

    const data = [{ deep: createDeepObject(100) }];

    const analysis = analyzeField(data, 'deep.nested.nested.nested.nested.nested');
    expect(analysis.name).toBe('deep.nested.nested.nested.nested.nested');
    expect(analysis.nonEmptyCount + analysis.emptyCount).toBe(1);
  });

  it('handles special characters in field names', () => {
    const data = [
      { 'field.with.dots': 'value1', 'field-with-dashes': 'value2' },
      { 'field.with.dots': 'value3', 'field-with-dashes': 'value4' }
    ];

    const analysis1 = analyzeField(data, 'field.with.dots');
    const analysis2 = analyzeField(data, 'field-with-dashes');

    expect(analysis1.nonEmptyCount).toBe(2);
    expect(analysis2.nonEmptyCount).toBe(2);
  });
});

describe('Field Analysis Details Edge Cases', () => {
  it('handles non-string identifiers correctly', () => {
    const data = [
      { id: 123, value: '' },
      { id: true, value: null },
      { id: { nested: 'id' }, value: undefined }
    ];

    const details = analyzeFieldDetails(data, 'value', 'id');
    expect(details).toHaveLength(3);
    expect(details.every(d => d.isEmpty)).toBe(true);
    expect(details[0].identifier).toBe('123');
  });

  it('handles extremely nested identifier paths', () => {
    const data = [
      {
        meta: { user: { profile: { id: 'deep-id' } } },
        value: null
      }
    ];

    const details = analyzeFieldDetails(data, 'value', 'meta.user.profile.id');
    expect(details).toHaveLength(1);
    expect(details[0].identifier).toBe('deep-id');
  });

  it('handles very long identifiers', () => {
    const longId = 'x'.repeat(1000);
    const data = [{ id: longId, value: null }];

    const details = analyzeFieldDetails(data, 'value', 'id');
    expect(details).toHaveLength(1);
    expect(details[0].identifier).toBe(longId);
  });
});

describe('Extreme Input Scenarios', () => {
  it('handles extremely large datasets without performance degradation', () => {
    const largeData = new Array(10000).fill({ field: 'value' });
    const analysis = analyzeField(largeData, 'field');
    expect(analysis.nonEmptyCount).toBe(10000);
    expect(analysis.emptyCount).toBe(0);
    expect(analysis.uniqueValues).toBe(1);
  });

  it('handles inputs with circular references', () => {
    const circularObject: Record<string, unknown> = { field: 'value' };
    circularObject.self = circularObject;

    const data = [circularObject];
    const analysis = analyzeField(data, 'field');
    expect(analysis.nonEmptyCount).toBe(1);
    expect(analysis.emptyCount).toBe(0);
  });

  it('handles prototype pollution attempts', () => {
    const maliciousObject = JSON.parse(
      '{"__proto__": {"polluted": true}, "field": null}'
    );
    const data = [maliciousObject];

    const analysis = analyzeField(data, 'field');
    expect(analysis.emptyCount).toBe(1);
    expect(analysis.nonEmptyCount).toBe(0);
  });
});

describe('Type Handling Edge Cases', () => {
  it('handles Symbol and BigInt inputs', () => {
    const data = [{ field: Symbol('test') }, { field: BigInt(123) }];

    const analysis = analyzeField(data, 'field');
    expect(analysis.nonEmptyCount).toBe(2);
    expect(analysis.uniqueValues).toBe(2);
  });

  it('handles function and complex object inputs', () => {
    const data = [{ field: () => {} }, { field: new Date() }, { field: /regex/ }];

    const analysis = analyzeField(data, 'field');
    expect(analysis.nonEmptyCount).toBe(3);
    expect(analysis.uniqueValues).toBe(3);
  });
});

describe('Complex Path Resolution', () => {
  it('handles extremely deep nested paths', () => {
    const deepObject = { a: { b: { c: { d: { e: { f: 'value' } } } } } };
    const data = [deepObject];

    const analysis = analyzeField(data, 'a.b.c.d.e.f');
    expect(analysis.nonEmptyCount).toBe(1);
    expect(analysis.emptyCount).toBe(0);
    expect(analysis.uniqueValues).toBe(1);
  });

  it('handles paths with non-existent intermediate keys', () => {
    const data = [{ some: {} }];

    const analysis = analyzeField(data, 'some.nonexistent.path');
    expect(analysis.emptyCount).toBe(1);
    expect(analysis.nonEmptyCount).toBe(0);
    expect(analysis.uniqueValues).toBe(0);
  });
});
