import { Editor } from "@tiptap/react";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageButtonProps {
  editor: Editor;
  openImagePopover: (options: {
    src?: string;
    alt?: string;
    id?: string | undefined;
    position?: { x: number; y: number; width: number; height: number } | null;
  }) => void;
}

export function ImageButton({ editor, openImagePopover }: ImageButtonProps) {
  const handleClick = () => {
    // Create a position for the popover based on editor cursor position
    const view = editor.view;
    const { from } = view.state.selection;
    const pos = view.coordsAtPos(from);

    // Prepare position data for the popover
    const position = {
      x: pos.left,
      y: pos.top,
      width: 1,
      height: 1,
    };

    // Open the image popover with appropriate settings
    openImagePopover({
      src: "",
      alt: "",
      id: undefined,
      position,
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(editor.isActive("blockImage") && "bg-muted")}
    >
      <ImageIcon className="h-4 w-4" />
    </Button>
  );
}
