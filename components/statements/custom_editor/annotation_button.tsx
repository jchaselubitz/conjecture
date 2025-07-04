import { Editor } from '@tiptap/react';
import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnnotationButtonProps {
  onAnnotate: () => void;
}

export const AnnotationButton = ({ onAnnotate }: AnnotationButtonProps) => {
  return (
    <Button variant="ghost" size="sm" onClick={onAnnotate} title="Create annotation">
      <MessageCircle className="h-4 w-4" /> Comment
    </Button>
  );
};
