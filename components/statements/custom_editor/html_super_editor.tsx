import 'katex/dist/katex.min.css';
import { EditorContent, FloatingMenu } from '@tiptap/react';
import { AnnotationWithComments, DraftWithAnnotations } from 'kysely-codegen';
import React, { useEffect, useRef } from 'react';
import { useStatementContext } from '@/contexts/statementContext';
import { cn } from '@/lib/utils';

import { AnnotationMenu } from './annotation_menu';
import { BlockTypeChooser } from './block_type_chooser';
import { CitationNodeEditor } from './citation_node_editor';
import { EditorMenu } from './editor_menu';
import { useHtmlSuperEditor } from './hooks/useHtmlSuperEditor';

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
  setFootnoteIds
}: HTMLSuperEditorProps) => {
  const { latexPopoverOpen, imagePopoverOpen, visualViewport } = useStatementContext();

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
          annotatable && 'annotator-container',
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
        setSelectedAnnotationId={setSelectedAnnotationId}
        statementId={statementId}
        editor={editor}
      />

      {editMode && !latexPopoverOpen && !imagePopoverOpen && (
        <div>
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <BlockTypeChooser statementId={statementId} editor={editor} />
          </FloatingMenu>
        </div>
      )}

      {editMode && editor && (
        <div
          className="fixed flex z-50 bottom-0 left-0 right-0 mx-auto md:bottom-5 md:left-auto md:right-auto md:mx-auto md:ml-20 px-2 justify-center "
          style={{
            height: 'fit-content',
            ...(visualViewport && {
              bottom: `${Math.max(10, window.innerHeight - visualViewport)}px`
            })
          }}
        >
          <EditorMenu statementId={statementId} editor={editor} />
        </div>
      )}
    </div>
  );
};

export default HTMLSuperEditor;
