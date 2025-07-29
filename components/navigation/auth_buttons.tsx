'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function AuthButtons() {
  const pathname = usePathname();

  return (
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
  );
}
