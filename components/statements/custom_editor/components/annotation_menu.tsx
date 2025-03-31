import { BubbleMenu } from "@tiptap/react";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import { createStatementAnnotation } from "@/lib/helpers/helpersStatements";
import { cn } from "@/lib/utils";

import { AnnotationButton } from "./annotation-button";
import { QuoteLinkButton } from "./quote-link-button";
interface AnnotationMenuProps {
  draftId: string;
  statementCreatorId: string;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  setSelectedAnnotationId: (id: string) => void;
  canAnnotate?: boolean;
  editMode: boolean;
}

export const AnnotationMenu = ({
  draftId,
  statementCreatorId,
  showAuthorComments,
  showReaderComments,
  editMode,
  setSelectedAnnotationId,
  canAnnotate = false,
}: AnnotationMenuProps) => {
  const { userId } = useUserContext();
  const { editor, annotations, setAnnotations } = useStatementContext();
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
        {!editMode && <QuoteLinkButton editor={editor} />}

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
