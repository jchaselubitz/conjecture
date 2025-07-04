'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useWindowSize } from 'react-use';

import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';

import { Button } from '../ui/button';
import ViewModeButton from '../view_mode_button';

import MobileNav from './mobile_nav';
import UserButton from './user_button';

export default function ReadNav() {
  const params = useParams();
  const userSlug = params.userSlug;
  const { currentUserSlug } = useUserContext();
  const { statement, isCreator } = useStatementContext();

  const router = useRouter();
  const isMobile = useWindowSize().width < 600;

  const isPublished = statement?.draft.publishedAt;

  return (
    <header className="h-14">
      <div className="fixed z-50 top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <MobileNav />
            <Button variant="ghost" size="icon" onClick={() => router.push(`/${userSlug}/`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3">
              <Link href="/feed">Feed</Link>
              <Link href={`/${currentUserSlug}`}>My Conjectures</Link>
            </div>
            <div className="flex items-center gap-3">
              {statement && isCreator && <ViewModeButton iconOnly={isMobile} variant="default" />}
              <UserButton />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
