import { Editor } from "@tiptap/react";

import { ImagePopoverEditor } from "./image-popover-editor";

export type NewImageData = {
  file?: File | undefined;
  src?: string;
  alt: string;
  id?: string | undefined;
};

interface ImageNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImageData: NewImageData;
  editor: Editor;
  statementId: string;
  nodePosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export function ImageNodeEditor({
  open,
  onOpenChange,
  initialImageData,
  nodePosition,
  editor,
  statementId,
}: ImageNodeEditorProps) {
  if (!nodePosition || !open) return null;

  const { src, alt, id } = initialImageData;

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
      <ImagePopoverEditor
        open={open}
        onOpenChange={onOpenChange}
        imageData={{ src, alt, id }}
        editor={editor}
        statementId={statementId}
      >
        <div />
      </ImagePopoverEditor>
    </div>
  );
}
