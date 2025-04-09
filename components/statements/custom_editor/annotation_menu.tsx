import { BubbleMenu } from "@tiptap/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import { createStatementAnnotation } from "@/lib/helpers/helpersStatements";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

import { AnnotationButton } from "./annotation_button";
import { QuoteLinkButton } from "./quote_link_button";
interface AnnotationMenuProps {
  draftId: string;
  statementCreatorId: string;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  setSelectedAnnotationId: (id: string) => void;
  canAnnotate?: boolean;
  editMode: boolean;
  statementId: string;
}

export const AnnotationMenu = ({
  draftId,
  statementCreatorId,
  showAuthorComments,
  showReaderComments,
  editMode,
  statementId,
  setSelectedAnnotationId,
  canAnnotate = false,
}: AnnotationMenuProps) => {
  const { userId } = useUserContext();
  const { editor, annotations, setAnnotations } = useStatementContext();
  const { copy, copied } = useCopyToClipboard(
    editor?.state.selection.toString() ?? "",
  );

  if (!editor) return null;

  const handleAnnotationCreate = async () => {
    await createStatementAnnotation({
      userId,
      editor,
      draftId,
      annotations,
      statementCreatorId,
      showAuthorComments,
      showReaderComments,
      setSelectedAnnotationId,
      setAnnotations,
    });
  };

  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100, zIndex: 90 }}>
      <div
        className={cn(
          "flex flex-wrap w-fit gap-2 p-2 rounded-lg bg-background border shadow-sm",
          editMode && !canAnnotate && "hidden",
        )}
      >
        {!editMode && (
          <>
            <QuoteLinkButton editor={editor} statementId={statementId} />
            <Button variant="ghost" size="sm" onClick={copy}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy
            </Button>
          </>
        )}

        {canAnnotate && (
          <AnnotationButton
            editor={editor}
            onAnnotate={handleAnnotationCreate}
          />
        )}
      </div>
    </BubbleMenu>
  );
};
