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
    <header className=" ">
      <div className="fixed z-50 top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/statements/${statement?.statementId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {editor && (
              <AnnotationModeButton
                annotationMode={annotationMode}
                handleAnnotationModeToggle={handleAnnotationModeToggle}
                iconOnly={isMobile}
                variant={annotationMode ? 'outline' : 'default'}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
