import { Editor } from "@tiptap/react";
import { Heading1, Heading2, List, ListOrdered, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LatexButton } from "./latex-button";

interface BlockTypeChooserProps {
  editor: Editor;
  openLatexPopover: (options: {
    latex?: string;
    displayMode?: boolean;
    id?: string | null;
  }) => void;
}

export const BlockTypeChooser = ({
  editor,
  openLatexPopover,
}: BlockTypeChooserProps) => {
  if (!editor) return null;

  return (
    <div data-testid="floating-menu" className="floating-menu">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(editor.isActive("heading", { level: 1 }) && "bg-muted")}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(editor.isActive("heading", { level: 2 }) && "bg-muted")}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(editor.isActive("bulletList") && "bg-muted")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleOrderedList().run();
          console.log("orderedList");
        }}
        className={cn(editor.isActive("orderedList") && "bg-muted")}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(editor.isActive("blockquote") && "bg-muted")}
      >
        <Quote className="h-4 w-4" />
      </Button>
      <LatexButton
        editor={editor}
        displayMode={true}
        openLatexPopover={openLatexPopover}
      />
    </div>
  );
};
