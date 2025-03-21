import Link from "next/link";

import CreatePostButton from "../special_buttons/create_post_button";
import UserButton from "./user_button";
export default function AppNav() {
  return (
    <header className="border-b px-4">
      <div className="flex h-16 items-center justify-between w-full ">
        <Link href="/feed" className="font-semibold text-xl">
          Conjecture
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/explore">Explore</Link>

          <CreatePostButton
            text="New Conjecture"
            loadingText="Creating ..."
            successText="Created"
          />
          <UserButton />
        </nav>
      </div>
    </header>
  );
}
