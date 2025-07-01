import { offset } from '@floating-ui/dom';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import Link from 'next/link';
import { RefObject } from 'react';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';

import { Button } from '@/components/ui/button';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useUserContext } from '@/contexts/userContext';
import { setPanelState } from '@/lib/helpers/helpersLayout';
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
  canAnnotate: boolean;
  editMode: boolean;
  statementId: string;
  editor: Editor | null;
  panelGroupRef: RefObject<ImperativePanelGroupHandle | null>;
}

export const AnnotationMenu = ({
  draftId,
  statementCreatorId,
  showAuthorComments,
  showReaderComments,
  editMode,
  statementId,
  canAnnotate,
  editor,
  panelGroupRef
}: AnnotationMenuProps) => {
  const { userId } = useUserContext();
  const { annotations, setAnnotations, setSelectedAnnotationId } = useStatementAnnotationContext();
  const { copy, copied } = useCopyToClipboard(editor?.state.selection.toString() ?? '');

  if (!editor) return null;

  const handleAnnotationCreate = async () => {
    setPanelState({
      target: 'annotation_panel_size',
      isOpen: true,
      panelGroupRef
    });
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
    <BubbleMenu
      editor={editor}
      shouldShow={() => {
        return editor.isEditable;
      }}
      options={{
        // middleware: [offset(6)],
        placement: 'top'
      }}
    >
      {userId ? (
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
          <AnnotationButton editor={editor} onAnnotate={handleAnnotationCreate} />
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-background border shadow-sm p-2 rounded-lg">
          <Link href="/login">
            <Button variant="default" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button variant="outline" size="sm">
              Create Account
            </Button>
          </Link>
        </div>
      )}
    </BubbleMenu>
  );
};
