'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CardRedirect({ target }: { target: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return null;
}
