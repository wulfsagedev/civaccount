import { describe, expect, it } from 'vitest';
import { editErrorMessage } from './proposals';

describe('editErrorMessage', () => {
  it('explains a closed edit window', () => {
    expect(editErrorMessage({ message: 'Edit window has closed' })).toMatch(/15 minutes/);
  });

  it('offers a retry for anything else', () => {
    expect(editErrorMessage({ message: 'network error' })).toBe('Could not save your changes. Try again.');
  });
});
