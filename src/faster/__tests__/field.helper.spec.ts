import { field, numField } from '../templates/field.helper';

describe('field()', () => {
  it('pads a short value with spaces on the right', () => {
    expect(field(10, 'hello')).toBe('hello     ');
  });

  it('truncates a value that exceeds the field length', () => {
    expect(field(3, 'hello')).toBe('hel');
  });

  it('returns the value unchanged when it exactly fits', () => {
    expect(field(5, 'hello')).toBe('hello');
  });

  it('returns all spaces for an empty string', () => {
    expect(field(5, '')).toBe('     ');
  });

  it('returns all spaces for null', () => {
    expect(field(5, null)).toBe('     ');
  });

  it('returns all spaces for undefined', () => {
    expect(field(5, undefined)).toBe('     ');
  });

  it('returns an empty string for zero-length field', () => {
    expect(field(0, 'hello')).toBe('');
  });

  it('handles single character field', () => {
    expect(field(1, 'M')).toBe('M');
    expect(field(1, 'Male')).toBe('M');
    expect(field(1, '')).toBe(' ');
  });
});

describe('numField()', () => {
  it('pads a short value with spaces on the left', () => {
    expect(numField(5, '42')).toBe('   42');
  });

  it('truncates a value that exceeds the field length', () => {
    expect(numField(3, '12345')).toBe('123');
  });

  it('returns the value unchanged when it exactly fits', () => {
    expect(numField(3, '123')).toBe('123');
  });

  it('returns all spaces for null', () => {
    expect(numField(5, null)).toBe('     ');
  });

  it('returns all spaces for undefined', () => {
    expect(numField(5, undefined)).toBe('     ');
  });

  it('returns all spaces for empty string', () => {
    expect(numField(5, '')).toBe('     ');
  });
});
