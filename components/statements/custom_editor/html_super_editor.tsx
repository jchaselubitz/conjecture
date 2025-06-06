import 'katex/dist/katex.min.css';

import { EditorContent, FloatingMenu } from '@tiptap/react';
import { AnnotationWithComments, DraftWithAnnotations } from 'kysely-codegen';
import React, { RefObject } from 'react';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';

import { useStatementToolsContext } from '@/contexts/StatementToolsContext';
import { cn } from '@/lib/utils';

import { useHtmlSuperEditor } from './hooks/useHtmlSuperEditor';
import { AnnotationMenu } from './annotation_menu';
import { BlockTypeChooser } from './block_type_chooser';
import { CitationNodeEditor } from './citation_node_editor';
interface HTMLSuperEditorProps {
  statement: DraftWithAnnotations;
  existingAnnotations: AnnotationWithComments[];
  userId: string | undefined;
  onAnnotationClick?: (id: string) => void;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  annotatable?: boolean;
  editMode: boolean;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  setFootnoteIds: (ids: string[]) => void;
  panelGroupRef: RefObject<ImperativePanelGroupHandle | null>;
}

const HTMLSuperEditor = ({
  existingAnnotations,
  userId,
  statement,
  onAnnotationClick,
  style,
  className,
  placeholder,
  annotatable,
  editMode,
  selectedAnnotationId,
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
  setFootnoteIds,
  panelGroupRef
}: HTMLSuperEditorProps) => {
  const { latexPopoverOpen, imagePopoverOpen } = useStatementToolsContext();

  const draftId = statement.id;
  const statementId = statement.statementId;
  const statementCreatorId = statement.creatorId;

  const editor = useHtmlSuperEditor({
    statement,
    existingAnnotations,
    userId,
    onAnnotationClick,
    placeholder,
    annotatable,
    editMode,
    selectedAnnotationId,
    setSelectedAnnotationId,
    setFootnoteIds
  });

  return (
    <div
      className={cn(
        'relative',
        editMode ? 'editMode-container' : 'annotator-container',
        showAuthorComments && 'show-author-comments',
        showReaderComments && 'show-reader-comments',
        className
      )}
      style={style}
    >
      <EditorContent
        editor={editor}
        className={cn(
          'ProseMirror',
          annotatable && 'annotator-container' && 'min-h-[40px]',
          !editMode && 'pseudo-readonly'
        )}
        spellCheck={editMode}
        inputMode={editMode ? 'text' : 'none'}
        readOnly={!editMode}
      />
      <div>
        <CitationNodeEditor
          statementId={statementId}
          creatorId={statementCreatorId}
          editMode={editMode}
          editor={editor}
        />
      </div>

      <AnnotationMenu
        editMode={editMode ?? false}
        draftId={draftId}
        statementCreatorId={statementCreatorId}
        showAuthorComments={showAuthorComments}
        showReaderComments={showReaderComments}
        canAnnotate={annotatable}
        statementId={statementId}
        editor={editor}
        panelGroupRef={panelGroupRef}
      />

      {editMode && !latexPopoverOpen && !imagePopoverOpen && (
        <div>
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <BlockTypeChooser statementId={statementId} editor={editor} />
          </FloatingMenu>
        </div>
      )}
    </div>
  );
};

export default HTMLSuperEditor;
