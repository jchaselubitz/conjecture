import { Editor } from "@tiptap/react";
import { Calculator, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LatexButtonProps {
  editor: Editor;
  displayMode: boolean;
  openLatexPopover: (options: {
    latex?: string;
    displayMode?: boolean;
    id?: string | null;
    position?: { x: number; y: number; width: number; height: number } | null;
  }) => void;
}

export function LatexButton({
  editor,
  displayMode,
  openLatexPopover,
}: LatexButtonProps) {
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

    // Open the LaTeX popover with appropriate settings
    openLatexPopover({
      latex: "",
      displayMode,
      id: null,
      position,
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        editor.isActive("popoverLatex", { displayMode }) && "bg-muted",
      )}
    >
      <Sigma className="h-4 w-4" />
    </Button>
  );
}
