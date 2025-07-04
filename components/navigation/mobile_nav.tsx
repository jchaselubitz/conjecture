'use client';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useUserContext } from '@/contexts/userContext';

import CreatePostButton from '../special_buttons/create_post_button';
import { Button } from '../ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { userId, currentUserSlug } = useUserContext();

  return (
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
              <Link href={`/${currentUserSlug}`} className="text-lg" onClick={() => setOpen(false)}>
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
  );
}
