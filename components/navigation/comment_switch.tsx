'use client';

import { Pencil } from 'lucide-react';
import { useWindowSize } from 'react-use';

import { useEditModeContext } from '@/contexts/EditModeContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { cn } from '@/lib/utils';

import AnnotationModeSwitch from '../annotation_mode_button';
import { Button } from '../ui/button';

export default function CommentSwitch({
  annotationMode,
  setAnnotationMode
}: {
  annotationMode: boolean;
  setAnnotationMode: (annotationMode: boolean) => void;
}) {
  const { editor, isCreator } = useStatementContext();
  const { setEditMode } = useEditModeContext();
  const isMobile = useWindowSize().width < 600;

  if (!editor) {
    return null;
  }

  return (
    <div className="sticky z-50 bottom-6 w-full flex gap-1 justify-end">
      {(isMobile || !editor?.isEditable) && (
        <AnnotationModeSwitch
          checked={annotationMode}
          onChange={checked => {
            setAnnotationMode(checked);
            editor?.setEditable(checked);
          }}
          className={cn('bg-white rounded-full shadow-md border border-zinc-200')}
        />
      )}

      {isCreator && (
        <Button
          variant={'outline'}
          className="rounded-full shadow-md"
          onClick={() => setEditMode(true)}
        >
          <span className="sr-only">Edit</span>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
