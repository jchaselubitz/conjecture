'use client';

import { Editor } from '@tiptap/react';

import { useStatementToolsContext } from '@/contexts/StatementToolsContext';

import dynamic from 'next/dynamic';

const CitationPopover = dynamic(
  () => import('./citation_popover').then(mod => mod.CitationPopover),
  { ssr: false }
);
interface CitationNodeEditorProps {
  statementId: string;
  creatorId: string;
  editMode: boolean;
  editor?: Editor | null;
}

export function CitationNodeEditor({
  statementId,
  creatorId,
  editMode,
  editor
}: CitationNodeEditorProps) {
  const { selectedNodePosition } = useStatementToolsContext();

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
        zIndex: 50
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
