import { Editor } from "@tiptap/react";
import { Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStatementContext } from "@/contexts/statementContext";
import { openLatexPopover } from "@/lib/helpers/helpersStatements";
import { cn } from "@/lib/utils";
interface LatexButtonProps {
  editor: Editor;
  displayMode: boolean;
}

export function LatexButton({ editor, displayMode }: LatexButtonProps) {
  const {
    setLatexPopoverOpen,
    setCurrentLatex,
    setIsBlock,
    setSelectedLatexId,
    setSelectedNodePosition,
  } = useStatementContext();
  const handleClick = () => {
    // Create a position for the popover based on editor cursor position
    const view = editor.view;
    const { from } = view.state.selection;
    const pos = view.coordsAtPos(from);

    const position = {
      x: pos.left,
      y: pos.top,
      width: 1,
      height: 1,
    };

    openLatexPopover({
      latex: "",
      displayMode,
      latexId: null,
      position,
      setCurrentLatex,
      setIsBlock,
      setSelectedLatexId,
      setSelectedNodePosition,
      setLatexPopoverOpen,
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        editor.isActive("popoverLatex", { displayMode }) && "bg-muted"
      )}
    >
      <Sigma className="h-4 w-4" />
    </Button>
  );
}
