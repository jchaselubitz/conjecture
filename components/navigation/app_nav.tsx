'use client';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useUserContext } from '@/contexts/userContext';

import CreatePostButton from '../special_buttons/create_post_button';
import { Button } from '../ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';

import UserButton from './user_button';
import { useNavContext } from '@/contexts/NavContext';

export default function AppNav() {
  const [open, setOpen] = useState(false);
  const { userId, currentUserSlug } = useUserContext();
  const { showNav } = useNavContext();

  if (!showNav) return null;

  return (
    <header className="border-b px-4 z-40 bg-background">
      <div className="flex h-16 items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Drawer open={open} direction="left" onOpenChange={setOpen}>
            <DrawerTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Menu</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-4 p-4">
                <Link href="/feed" className="text-lg" onClick={() => setOpen(false)}>
                  Feed
                </Link>
                {userId && (
                  <>
                    <Link
                      href={`/${currentUserSlug}`}
                      className="text-lg"
                      onClick={() => setOpen(false)}
                    >
                      My Conjectures
                    </Link>

                    <CreatePostButton
                      text="New Conjecture"
                      loadingText="Creating ..."
                      successText="Created"
                    />
                  </>
                )}
              </div>
            </DrawerContent>
          </Drawer>
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
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="default" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" size="sm">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
