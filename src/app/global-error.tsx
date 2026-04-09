'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#fafafa', color: '#1c1917' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
          <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '64px', fontWeight: 700, color: '#d4d4d4', marginBottom: '24px', lineHeight: 1 }}>Oops</p>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>Something went wrong</h1>
            <p style={{ fontSize: '16px', color: '#737373', marginBottom: '32px', lineHeight: 1.6 }}>
              The app hit an unexpected error. Try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                height: '44px', padding: '0 24px', borderRadius: '8px',
                backgroundColor: '#1c1917', color: '#fafafa', border: 'none',
                fontSize: '16px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {error.digest && (
              <p style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '32px' }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
