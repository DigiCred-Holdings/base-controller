/**
 * Format a value into a fixed-length field for FASTER export.
 * - If value is longer than length, truncate from the right.
 * - If value is shorter than length, pad with spaces on the right.
 * - Null/undefined values become all spaces.
 *
 * @param length - The exact character width of the field
 * @param value  - The string value to format
 * @returns Fixed-length string, left-aligned and space-padded
 */
export function field(length: number, value: string | null | undefined): string {
  const str = (value ?? '').toString();
  if (str.length > length) {
    return str.substring(0, length);
  }
  return str.padEnd(length, ' ');
}

/**
 * Right-aligned numeric field. Pads with spaces on the left.
 *
 * @param length - The exact character width of the field
 * @param value  - The string value to format
 * @returns Fixed-length string, right-aligned and space-padded
 */
export function numField(length: number, value: string | null | undefined): string {
  const str = (value ?? '').toString();
  if (str.length > length) {
    return str.substring(0, length);
  }
  return str.padStart(length, ' ');
}
