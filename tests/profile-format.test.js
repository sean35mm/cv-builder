import { describe, expect, test } from 'bun:test';
import { normalizeExternalUrl } from '../lib/profile-format';

describe('normalizeExternalUrl', () => {
  test('accepts HTTP, HTTPS, and bare domains', () => {
    expect(normalizeExternalUrl('http://example.com/path')).toBe(
      'http://example.com/path'
    );
    expect(normalizeExternalUrl('https://example.com')).toBe(
      'https://example.com/'
    );
    expect(normalizeExternalUrl(' example.com/profile ')).toBe(
      'https://example.com/profile'
    );
  });

  test('rejects unsafe and malformed schemes', () => {
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,hello',
      'file:///tmp/resume',
      'ftp://example.com',
      'http://',
      'ht!tp://example.com',
    ]) {
      expect(normalizeExternalUrl(value)).toBeUndefined();
    }
  });
});
