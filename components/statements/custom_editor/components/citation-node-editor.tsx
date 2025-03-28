"use client";

import { Editor } from "@tiptap/react";
import { NewStatementCitation } from "kysely-codegen";

import { CitationPopoverEditor } from "./citation-popover-editor";

interface CitationNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCitationData: NewStatementCitation;
  editor: Editor;
  statementId: string;
  nodePosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export function CitationNodeEditor({
  open,
  onOpenChange,
  initialCitationData,
  nodePosition,
  editor,
  statementId,
}: CitationNodeEditorProps) {
  if (!nodePosition || !open) return null;

  return (
    <div
      className="fixed"
      style={{
        top: `${nodePosition.y}px`,
        left: `${nodePosition.x}px`,
        width: "1px",
        height: "1px",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <CitationPopoverEditor
        open={open}
        onOpenChange={onOpenChange}
        citationData={initialCitationData}
        editor={editor}
        statementId={statementId}
      >
        <div />
      </CitationPopoverEditor>
    </div>
  );
}
