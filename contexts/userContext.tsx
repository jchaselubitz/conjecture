"use client";

import { BaseProfile } from "kysely-codegen";
import { createContext, ReactNode, useContext, useState } from "react";

// Define the context type
interface UserContextType {
  userId: string | undefined;
  imageUrl: string | undefined;
  name: string | undefined;
  email: string | undefined;
  username: string | undefined;
  settingsDialog: boolean;
  setSettingsDialog: (settingsDialog: boolean) => void;
}

// Create the context with default values
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create the provider component
export function UserProvider({
  children,
  userProfile,
  userEmail,
}: {
  children: ReactNode;
  userProfile?: BaseProfile | null;
  userEmail?: string | null;
}) {
  const [settingsDialog, setSettingsDialog] = useState(false);
  const value = {
    userId: userProfile?.id || undefined,
    imageUrl: userProfile?.imageUrl || undefined,
    name: userProfile?.name || undefined,
    email: userEmail || undefined,
    username: userProfile?.username || undefined,
  };

  return (
    <UserContext.Provider
      value={{ ...value, settingsDialog, setSettingsDialog }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the context
export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
