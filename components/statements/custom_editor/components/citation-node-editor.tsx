"use client";

import { useStatementContext } from "@/contexts/statementContext";

import { CitationPopoverEditor } from "./citation-popover-editor";
interface CitationNodeEditorProps {
  statementId: string;
  creatorId: string;
}

export function CitationNodeEditor({
  statementId,
  creatorId,
}: CitationNodeEditorProps) {
  const { selectedNodePosition } = useStatementContext();

  if (!selectedNodePosition) return null;

  return (
    <div
      className="fixed"
      style={{
        top: `${selectedNodePosition.y}px`,
        left: `${selectedNodePosition.x}px`,
        width: "1px",
        height: "1px",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <CitationPopoverEditor statementId={statementId} creatorId={creatorId}>
        <div />
      </CitationPopoverEditor>
    </div>
  );
}
