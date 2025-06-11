'use client';
import { createContext, ReactNode, useContext, useState } from 'react';

interface EditModeContextType {
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);

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
