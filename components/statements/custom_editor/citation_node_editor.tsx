'use client';

import { useStatementContext } from '@/contexts/statementContext';

import { CitationPopover } from './citation_popover';
import { Editor } from '@tiptap/react';
interface CitationNodeEditorProps {
  statementId: string;
  creatorId: string;
  editMode: boolean;
  editor: Editor;
}

export function CitationNodeEditor({
  statementId,
  creatorId,
  editMode,
  editor,
}: CitationNodeEditorProps) {
  const { selectedNodePosition } = useStatementContext();

  if (!selectedNodePosition) return null;

  return (
    <div
      className="fixed"
      style={{
        top: `${selectedNodePosition.y}px`,
        left: `${selectedNodePosition.x}px`,
        width: '1px',
        height: '1px',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <CitationPopover
        statementId={statementId}
        creatorId={creatorId}
        editMode={editMode}
        editor={editor}
      >
        <div />
      </CitationPopover>
    </div>
  );
}
