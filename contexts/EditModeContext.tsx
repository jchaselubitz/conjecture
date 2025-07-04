'use client';
import { createContext, ReactNode, useContext, useState } from 'react';

import { setEditModeCookie } from '@/lib/helpers/helpersLayout';

import { useStatementAnnotationContext } from './StatementAnnotationContext';
import { useStatementContext } from './StatementBaseContext';

interface EditModeContextType {
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export function EditModeProvider({
  children,
  editModeEnabled
}: {
  children: ReactNode;
  editModeEnabled: boolean;
}) {
  const { statement } = useStatementContext();
  const { setSelectedAnnotationId } = useStatementAnnotationContext();

  const [editMode, setEditMode] = useState(editModeEnabled);

  const handleEditMode = (edit: boolean) => {
    setSelectedAnnotationId(undefined);
    setEditModeCookie(edit, statement?.statementId);
    if (edit) {
      setEditMode(true);
    } else {
      setEditMode(false);
    }
  };

  return (
    <EditModeContext.Provider value={{ editMode, setEditMode: handleEditMode }}>
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
