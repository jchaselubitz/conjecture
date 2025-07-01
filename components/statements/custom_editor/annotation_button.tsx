import { Editor } from '@tiptap/react';
import { MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnnotationButtonProps {
  editor: Editor;
  onAnnotate: () => void;
}

export const AnnotationButton = ({ editor, onAnnotate }: AnnotationButtonProps) => {
  // const isSelection = !editor.state.selection.empty;

  return (
    <Button variant="ghost" size="sm" onClick={onAnnotate} title="Create annotation">
      <MessageCircle className="h-4 w-4" /> Comment
    </Button>
  );
};
