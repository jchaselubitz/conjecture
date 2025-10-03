'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GoogleButton } from '@/lib/helpers/helpersLogin';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function AuthButtons({
  defaultOtherOptions,
  className
}: {
  defaultOtherOptions?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const [showOtherOptions, setShowOtherOptions] = useState(defaultOtherOptions ?? false);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {!showOtherOptions ? (
        <>
          <GoogleButton redirectTo={pathname ?? undefined} />
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => setShowOtherOptions(true)}
          >
            Other login options
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link href={`/login?redirect=${pathname}`}>
            <Button variant="default" size="sm">
              Login
            </Button>
          </Link>
          <Link href={`/sign-up?redirect=${pathname}`}>
            <Button variant="outline" size="sm">
              Create Account
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
