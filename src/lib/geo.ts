/**
 * Check if the user is in the UK based on the geo cookie set by middleware.
 * Returns true for UK users, false for non-UK, null if unknown.
 */
export function isUKUser(): boolean {
  if (typeof document === 'undefined') return true; // SSR — assume OK
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'geo') {
      return value === 'GB';
    }
  }
  return true; // No cookie yet — allow (middleware will set it on next request)
}
