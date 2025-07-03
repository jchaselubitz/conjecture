'use client';

import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWindowSize } from 'react-use';

import { useStatementContext } from '@/contexts/StatementBaseContext';
import { cn } from '@/lib/utils';

import AnnotationModeSwitch from '../annotation_mode_button';
import { Button } from '../ui/button';

export default function ReadNav({
  annotationMode,
  setAnnotationMode
}: {
  annotationMode: boolean;
  setAnnotationMode: (annotationMode: boolean) => void;
}) {
  const { editor, isCreator } = useStatementContext();
  const isMobile = useWindowSize().width < 600;
  const pathname = usePathname();

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
