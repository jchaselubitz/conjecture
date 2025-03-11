"use client";

import Link from "next/link";

import { Button } from "../ui/button";

export default function AppNav() {
  return (
    <header className="border-b px-4">
      <div className="flex h-16 items-center justify-between w-full ">
        <Link href="/feed" className="font-semibold text-xl">
          Conjecture
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/explore">Explore</Link>
          <Link href="/statements/new">
            <Button>New Post</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
