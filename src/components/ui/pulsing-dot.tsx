'use client';

interface PulsingDotProps {
  size?: 'sm' | 'md';
  color?: 'green' | 'primary';
}

export function PulsingDot({ size = 'sm', color = 'green' }: PulsingDotProps) {
  const sizeClasses = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const colorClasses = color === 'green'
    ? { ping: 'bg-green-400', dot: 'bg-green-500' }
    : { ping: 'bg-primary/60', dot: 'bg-primary' };

  return (
    <span className={`relative flex ${sizeClasses}`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses.ping} opacity-75`} />
      <span className={`relative inline-flex rounded-full ${sizeClasses} ${colorClasses.dot}`} />
    </span>
  );
}
