import { Editor } from "@tiptap/react";
import { NewStatementCitation } from "kysely-codegen";
import { Quote, Superscript } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface CitationButtonProps {
  editor: Editor;
  statementId: string;
  openCitationPopover: (options: {
    citationData: NewStatementCitation;
    position?: { x: number; y: number; width: number; height: number } | null;
  }) => void;
}

export function CitationButton({
  editor,
  openCitationPopover,
  statementId,
}: CitationButtonProps) {
  const handleClick = () => {
    // Create a position for the popover based on editor cursor position
    const view = editor.view;
    const { from } = view.state.selection;
    const pos = view.coordsAtPos(from);

    // Open the citation popover with empty initial values
    openCitationPopover({
      citationData: {
        statementId,
        title: "",
        url: "",
        year: undefined,
        authorNames: "",
        issue: undefined,
        pageEnd: undefined,
        pageStart: undefined,
        publisher: undefined,
        titlePublication: undefined,
        volume: undefined,
        id: "",
      },
      position: {
        x: pos.left,
        y: pos.top,
        width: 1,
        height: 1,
      },
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(editor.isActive("citation") && "bg-muted")}
    >
      Cite
    </Button>
  );
}
