'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TensionResolution() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main story flow map page
    router.replace('/story-flow-map');
  }, [router]);

  return null;
}
