import { Editor } from '@tiptap/react';
import { MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnnotationButtonProps {
  editor: Editor;
  onAnnotate: () => void;
}

export const AnnotationButton = ({ editor, onAnnotate }: AnnotationButtonProps) => {
  // Only enable if there's a text selection
  const isSelection = !editor.state.selection.empty;
  if (!isSelection) return <></>;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onAnnotate}
      disabled={!isSelection}
      title="Create annotation"
      className={cn(!isSelection && 'opacity-50')}
    >
      <MessageCircle className="h-4 w-4" /> Comment
    </Button>
  );
};
