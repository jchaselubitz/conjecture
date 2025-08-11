'use client';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext } from 'react';

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
  const router = useRouter();
  const editMode = editModeEnabled;

  const versionNumber = statement?.draft.versionNumber;

  const handleEditMode = (edit: boolean) => {
    setSelectedAnnotationId(undefined);
    setEditModeCookie(edit, statement?.statementId);
    if (edit) {
      router.push(`/${statement?.creatorSlug}/${statement?.slug}/${versionNumber}?edit=true`);
    } else {
      router.push(`/${statement?.creatorSlug}/${statement?.slug}`);
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
