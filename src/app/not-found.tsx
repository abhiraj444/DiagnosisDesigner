'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-4">
        <Stethoscope className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        The requested clinical page or case note could not be found.
      </p>
      <Button asChild className="mt-6" size="sm">
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
