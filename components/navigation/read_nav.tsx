'use client';

import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWindowSize } from 'react-use';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';
import { cn } from '@/lib/utils';

import AnnotationModeButton from '../annotation_mode_button';
import { Button } from '../ui/button';

export default function ReadNav({
  annotationMode,
  setAnnotationMode
}: {
  annotationMode: boolean;
  setAnnotationMode: (annotationMode: boolean) => void;
}) {
  const { editor, updatedStatement } = useStatementContext();
  const { userId } = useUserContext();
  const isMobile = useWindowSize().width < 600;
  const pathname = usePathname();

  const isCreator = userId === updatedStatement.creatorId;

  if (!editor) {
    return null;
  }

  const handleAnnotationModeToggle = () => {
    if (annotationMode) {
      setAnnotationMode(false);
      editor?.setEditable(false);
    } else {
      setAnnotationMode(true);
      editor?.setEditable(true);
    }
  };

  return (
    <div className="sticky z-50 bottom-2 w-full flex gap-1 justify-end">
      {isMobile && (
        <AnnotationModeButton
          annotationMode={annotationMode}
          handleAnnotationModeToggle={handleAnnotationModeToggle}
          variant={annotationMode ? 'default' : 'outline'}
          className={cn('rounded-full shadow-md')}
        />
      )}

      {isCreator && (
        <Button variant={'outline'} className="rounded-full shadow-md">
          <Link href={`${pathname}?edit=true`}>
            <span className="sr-only">Edit</span>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
