'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'react-use';
import { useStatementContext } from '@/contexts/StatementBaseContext';

import AnnotationModeButton from '../annotation_mode_button';
import { cn } from '@/lib/utils';

export default function ReadNav({
  annotationMode,
  setAnnotationMode
}: {
  annotationMode: boolean;
  setAnnotationMode: (annotationMode: boolean) => void;
}) {
  const { editor, statement } = useStatementContext();
  const router = useRouter();
  const isMobile = useWindowSize().width < 768;

  if (!isMobile) {
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
    <div className="fixed z-50 bottom-2 right-4">
      {editor && (
        <AnnotationModeButton
          annotationMode={annotationMode}
          handleAnnotationModeToggle={handleAnnotationModeToggle}
          variant={annotationMode ? 'default' : 'outline'}
          className={cn('rounded-full shadow-md', annotationMode && 'h-10 w-10')}
        />
      )}
    </div>
  );
}
