import Link from 'next/link';

import { getUser } from '@/lib/actions/baseActions';

import CreatePostButton from '../special_buttons/create_post_button';

import { AuthButtons } from './auth_buttons';
import MobileNav from './mobile_nav';
import UserButton from './user_button';

export default async function SiteNav() {
  const user = await getUser();
  const userId = user?.id;
  const currentUserSlug = user?.user_metadata.username;

  return (
    <header className="border-b px-4 z-40 bg-background">
      <div className="flex h-16 items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <MobileNav />
          <Link href="/feed" className="font-semibold text-xl">
            Conject
          </Link>
        </div>
        <div className="flex items-center gap-6">
          {userId ? (
            <>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/feed">Feed</Link>
                <Link href={`/${currentUserSlug}`}>My Conjectures</Link>
                <CreatePostButton
                  text="New Conjecture"
                  loadingText="Creating ..."
                  successText="Created"
                />
              </nav>
              <UserButton />
            </>
          ) : (
            <AuthButtons />
          )}
        </div>
      </div>
    </header>
  );
}
