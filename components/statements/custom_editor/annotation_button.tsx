import { Editor } from "@tiptap/react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnnotationButtonProps {
  editor: Editor;
  onAnnotate: () => void;
}

export const AnnotationButton = ({
  editor,
  onAnnotate,
}: AnnotationButtonProps) => {
  // Only enable if there's a text selection
  const isEnabled = !editor.state.selection.empty;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onAnnotate}
      disabled={!isEnabled}
      title="Create annotation"
      className={cn(!isEnabled && "opacity-50")}
    >
      <MessageCircle className="h-4 w-4" />
    </Button>
  );
};
