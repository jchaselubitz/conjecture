'use client';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useNavContext } from './NavContext';

interface EditModeContextType {
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export function EditModeProvider({ children }: { children: ReactNode }) {
  const { setShowNav } = useNavContext();
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editMode) {
      setShowNav(false);
    } else {
      setShowNav(true);
    }
  }, [editMode, setShowNav]);

  return (
    <EditModeContext.Provider value={{ editMode, setEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditModeContext() {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditModeContext must be used within an EditModeProvider');
  }
  return context;
}
