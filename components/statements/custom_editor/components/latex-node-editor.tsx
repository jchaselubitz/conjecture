import { LatexPopoverEditor } from "./latex-popover-editor";

interface LatexNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLatex: string;
  isBlock: boolean;
  nodePosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  onSave: (latex: string) => void;
  onDelete?: () => void;
}

export function LatexNodeEditor({
  open,
  onOpenChange,
  initialLatex = "",
  isBlock = true,
  nodePosition,
  onSave,
  onDelete,
}: LatexNodeEditorProps) {
  if (!nodePosition || !open) return null;

  const handleSave = (latex: string) => {
    console.log("LatexNodeEditor save triggered:", {
      latex,
      isBlock,
      initialLatex,
    });
    onSave(latex);
  };

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
      <LatexPopoverEditor
        open={open}
        onOpenChange={onOpenChange}
        initialLatex={initialLatex}
        onSave={handleSave}
        onDelete={onDelete}
        isBlock={isBlock}
      >
        <div />
      </LatexPopoverEditor>
    </div>
  );
}
