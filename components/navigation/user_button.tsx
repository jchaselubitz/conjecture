"use client";

import { useState } from "react";
import { useUserContext } from "@/contexts/userContext";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import UserMenu from "./user_menu";

export default function UserButton() {
  const { userName, userImageUrl } = useUserContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <UserMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:ring-1 hover:ring-blue-700"
      >
        <Avatar>
          {userImageUrl && (
            <AvatarImage src={userImageUrl} className="object-cover" />
          )}
          <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
      </Button>
    </UserMenu>
  );
}
