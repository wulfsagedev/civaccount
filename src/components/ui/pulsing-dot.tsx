'use client';

interface PulsingDotProps {
  size?: 'sm' | 'md';
}

export function PulsingDot({ size = 'sm' }: PulsingDotProps) {
  const sizeClasses = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';

  return (
    <span className={`relative flex ${sizeClasses}`}>
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
        style={{ backgroundColor: '#5dba7d' }}
      />
      <span
        className={`relative inline-flex rounded-full ${sizeClasses}`}
        style={{ backgroundColor: '#4aab6a' }}
      />
    </span>
  );
}
