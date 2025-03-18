"use client";
import "./prose.css";
import "katex/dist/katex.min.css";
import CodeBlock from "@tiptap/extension-code-block";
import Gapcursor from "@tiptap/extension-gapcursor";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import katex from "katex";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  PenBox,
  Quote,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { InlineLatex } from "./custom_extensions/inline_latex";
import { LatexBlock } from "./custom_extensions/latex";
interface RichTextEditorProps {
  content: string | undefined | null;
  onChange: (content: string) => void;
  placeholder?: string;
}

const renderLatex = (latex: string) => {
  try {
    // Remove surrounding $ signs if they exist
    const content = latex.replace(/^\$|\$$/g, "");
    return katex.renderToString(content, {
      throwOnError: false,
      displayMode: false,
    });
  } catch (error) {
    console.error("Error rendering LaTeX:", error);
    return `<span class="latex-error">Error rendering LaTeX: ${latex}</span>`;
  }
};

// KaTeX block renderer function (display mode)
const renderLatexBlock = (latex: string) => {
  try {
    // Remove surrounding $$ signs if they exist
    const content = latex.replace(/^\$\$|\$\$$/g, "");
    return katex.renderToString(content, {
      throwOnError: false,
      displayMode: true,
    });
  } catch (error) {
    console.error("Error rendering LaTeX block:", error);
    return `<div class="latex-error">Error rendering LaTeX block: ${latex}</div>`;
  }
};

const floatingMenuButtons = ({ editor }: { editor: any }) => (
  <>
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
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
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
    <Button
      variant="ghost"
      size="sm"
      onClick={() => editor.chain().focus().toggleLatexBlock().run()}
      className={cn(editor.isActive("latexBlock") && "bg-muted")}
    >
      <PenBox className="h-4 w-4" />
    </Button>
  </>
);

const FloatingBar = ({ editor }: { editor: any }) => {
  return (
    <div data-testid="floating-menu" className="floating-menu">
      {floatingMenuButtons({ editor })}
    </div>
  );
};

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap w-fit gap-2 p-2 rounded-lg bg-background border shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(editor.isActive("bold") && "bg-muted")}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(editor.isActive("italic") && "bg-muted")}
      >
        <Italic className="h-4 w-4" />
      </Button>
      {floatingMenuButtons({ editor })}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(editor.isActive("codeBlock") && "bg-muted")}
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={setLink}
        className={cn(editor.isActive("link") && "bg-muted")}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={cn(editor.isActive("highlight") && "bg-muted")}
      >
        <Highlighter className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Typography,
      CodeBlock,
      Gapcursor,
      LatexBlock.configure({
        HTMLAttributes: {
          class: "math-block",
        },
        renderer: renderLatexBlock,
      }),
      InlineLatex.configure({
        HTMLAttributes: {
          class: "math-inline",
        },
        renderer: renderLatex,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-node-empty",
        showOnlyWhenEditable: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (content) {
      editor?.commands.setContent(content);
    }
  }, [content]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full rounded-lg overflow-hidden bg-background">
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="overflow-hidden"
        >
          <MenuBar editor={editor} />
        </BubbleMenu>
      )}
      {editor && (
        <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <FloatingBar editor={editor} />
        </FloatingMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
