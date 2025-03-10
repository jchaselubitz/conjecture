import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between mx-auto w-full">
          <Link href="/dashboard" className="font-semibold text-xl">
            Conjecture
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/explore">Explore</Link>
            <Link href="/posts/new">
              <Button>New Post</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
