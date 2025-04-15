import { BubbleMenu, Editor } from '@tiptap/react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';
import { createStatementAnnotation } from '@/lib/helpers/helpersStatements';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { cn } from '@/lib/utils';

import { AnnotationButton } from './annotation_button';
import { QuoteLinkButton } from './quote_link_button';
interface AnnotationMenuProps {
  draftId: string;
  statementCreatorId: string;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  canAnnotate?: boolean;
  editMode: boolean;
  statementId: string;
  editor: Editor | null;
}

export const AnnotationMenu = ({
  draftId,
  statementCreatorId,
  showAuthorComments,
  showReaderComments,
  editMode,
  statementId,
  canAnnotate = false,
  editor
}: AnnotationMenuProps) => {
  const { userId } = useUserContext();
  const { annotations, setAnnotations, setSelectedAnnotationId } = useStatementAnnotationContext();
  const { copy, copied } = useCopyToClipboard(editor?.state.selection.toString() ?? '');

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
      setAnnotations
    });
  };

  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100, zIndex: 90 }}>
      <div
        className={cn(
          'flex flex-wrap w-fit gap-2 p-2 rounded-lg bg-background border shadow-sm',
          editMode && !canAnnotate && 'hidden'
        )}
      >
        {!editMode && canAnnotate && (
          <div>
            <QuoteLinkButton editor={editor} statementId={statementId} />
           
          </div>
        )}

        {canAnnotate && <AnnotationButton editor={editor} onAnnotate={handleAnnotationCreate} />}
      </div>
    </BubbleMenu>
  );
};
