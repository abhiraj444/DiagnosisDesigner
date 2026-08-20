'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
        <h2 className="text-xl font-bold">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          {error?.message || 'An unexpected error occurred.'}
        </p>
        <Button onClick={() => reset()} size="sm">
          Try again
        </Button>
      </body>
    </html>
  );
}
