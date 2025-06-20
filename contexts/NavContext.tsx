'use client';
import { createContext, ReactNode, useContext, useState } from 'react';

interface NavContextType {
  showNav: boolean;
  setShowNav: (showNav: boolean) => void;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [showNav, setShowNav] = useState(false);

  return <NavContext.Provider value={{ showNav, setShowNav }}>{children}</NavContext.Provider>;
}

export function useNavContext() {
  const context = useContext(NavContext);
  if (context === undefined) {
    throw new Error('useNavContext must be used within an NavProvider');
  }
  return context;
}
