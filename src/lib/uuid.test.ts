import { describe, expect, it } from 'vitest';
import { extractUuids, extractUuidsFromCsv, extractUuidsFromJsonl } from '@/lib/uuid';

describe('UUID extraction from text', () => {
  it('finds valid uuid in simple text', () => {
    const text = 'Here is a UUID: 123e4567-e89b-42d3-a456-556642440000';

    const uuids = extractUuids(text);

    expect(uuids).toEqual(['123e4567-e89b-42d3-a456-556642440000']);
  });

  it('ignores text without valid uuids', () => {
    const text = 'No UUIDs here, just some random text';

    const uuids = extractUuids(text);

    expect(uuids).toEqual([]);
  });

  it('finds multiple valid uuids in text', () => {
    const text = `
      First: 123e4567-e89b-42d3-a456-556642440000
      Second: 987fcdeb-51a2-43d3-a456-426614174000
    `;

    const uuids = extractUuids(text);

    expect(uuids).toEqual([
      '123e4567-e89b-42d3-a456-556642440000',
      '987fcdeb-51a2-43d3-a456-426614174000'
    ]);
  });

  it('handles text with invalid uuid characters', () => {
    const text = 'UUID with invalid chars: 123e4567-e89b-42d3-a456-556642440000!!!';

    const uuids = extractUuids(text);

    expect(uuids).toEqual(['123e4567-e89b-42d3-a456-556642440000']);
  });

  it('ignores uuids with incorrect version number', () => {
    const text = '123e4567-e89b-52d3-a456-556642440000'; // Version 5 instead of 4

    const uuids = extractUuids(text);

    expect(uuids).toEqual([]);
  });
});

describe('UUID extraction from JSONL', () => {
  it('finds uuids in id fields of valid jsonl', () => {
    const jsonl = `
      {"id": "123e4567-e89b-42d3-a456-556642440000", "name": "Test 1"}
      {"id": "987fcdeb-51a2-43d3-a456-426614174000", "name": "Test 2"}
    `;

    const uuids = extractUuidsFromJsonl(jsonl, 'id');

    expect(uuids).toEqual([
      '123e4567-e89b-42d3-a456-556642440000',
      '987fcdeb-51a2-43d3-a456-426614174000'
    ]);
  });

  it('finds uuids in nested json fields', () => {
    const jsonl = `
      {"data": {"id": "123e4567-e89b-42d3-a456-556642440000"}}
      {"data": {"id": "987fcdeb-51a2-43d3-a456-426614174000"}}
    `;

    const uuids = extractUuidsFromJsonl(jsonl, 'data.id');

    expect(uuids).toEqual([
      '123e4567-e89b-42d3-a456-556642440000',
      '987fcdeb-51a2-43d3-a456-426614174000'
    ]);
  });

  it('handles jsonl with invalid lines', () => {
    const jsonl = `
      {"id": "123e4567-e89b-42d3-a456-556642440000"}
      invalid json line
      {"id": "987fcdeb-51a2-43d3-a456-426614174000"}
    `;

    const uuids = extractUuidsFromJsonl(jsonl, 'id');

    expect(uuids).toEqual([
      '123e4567-e89b-42d3-a456-556642440000',
      '987fcdeb-51a2-43d3-a456-426614174000'
    ]);
  });

  it('ignores jsonl entries without specified field', () => {
    const jsonl = `
      {"other_field": "123e4567-e89b-42d3-a456-556642440000"}
      {"id": "987fcdeb-51a2-43d3-a456-426614174000"}
    `;

    const uuids = extractUuidsFromJsonl(jsonl, 'id');

    expect(uuids).toEqual(['987fcdeb-51a2-43d3-a456-426614174000']);
  });
});

describe('UUID extraction from CSV', () => {
  it('finds uuids in specified csv column', () => {
    const csv = `
id,name
123e4567-e89b-42d3-a456-556642440000,Test 1
987fcdeb-51a2-43d3-a456-426614174000,Test 2
    `.trim();

    const uuids = extractUuidsFromCsv(csv, 'id');

    expect(uuids).toEqual([
      '123e4567-e89b-42d3-a456-556642440000',
      '987fcdeb-51a2-43d3-a456-426614174000'
    ]);
  });

  it('handles csv with missing column values', () => {
    const csv = `
id,name
123e4567-e89b-42d3-a456-556642440000,Test 1
,Test 2
987fcdeb-51a2-43d3-a456-426614174000,Test 3
    `.trim();

    const uuids = extractUuidsFromCsv(csv, 'id');

    expect(uuids).toEqual([
      '123e4567-e89b-42d3-a456-556642440000',
      '987fcdeb-51a2-43d3-a456-426614174000'
    ]);
  });

  it('ignores non-uuid values in csv column', () => {
    const csv = `
id,name
123e4567-e89b-42d3-a456-556642440000,Test 1
not-a-uuid,Test 2
987fcdeb-51a2-43d3-a456-426614174000,Test 3
    `.trim();

    const uuids = extractUuidsFromCsv(csv, 'id');

    expect(uuids).toEqual([
      '123e4567-e89b-42d3-a456-556642440000',
      '987fcdeb-51a2-43d3-a456-426614174000'
    ]);
  });

  it('returns empty array for csv without specified column', () => {
    const csv = `
name,value
Test 1,123e4567-e89b-42d3-a456-556642440000
Test 2,987fcdeb-51a2-43d3-a456-426614174000
    `.trim();

    const uuids = extractUuidsFromCsv(csv, 'id');

    expect(uuids).toEqual([]);
  });
});
