'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'react-use';
import { useStatementContext } from '@/contexts/StatementBaseContext';

import AnnotationModeButton from '../annotation_mode_button';
import { Button } from '../ui/button';

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
      router.push(`/statements/${statement?.statementId}`);
    } else {
      setAnnotationMode(true);
      editor?.setEditable(true);
      router.push(`/statements/${statement?.statementId}?annotation-mode=true`);
    }
  };

  return (
    <div className="fixed z-50 bottom-2 right-4">
      {editor && (
        <AnnotationModeButton
          annotationMode={annotationMode}
          handleAnnotationModeToggle={handleAnnotationModeToggle}
          iconOnly={isMobile}
          variant="default"
          className="rounded-full h-10 w-10"
        />
      )}
    </div>
  );
}
