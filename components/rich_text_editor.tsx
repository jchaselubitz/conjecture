"use client";

import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

interface RichTextEditorProps {
  content: string | undefined;
  onChange: (content: string) => void;
  placeholder?: string;
}

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
    <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-background border shadow-sm">
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
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full rounded-lg overflow-hidden bg-background">
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--tw-prose-captions);
          opacity: 0.5;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror:focus p.is-editor-empty:first-child::before {
          display: none;
        }

        .ProseMirror h1 {
          font-size: 2.25em;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 0;
          margin-bottom: 0.8em;
        }

        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 1.6em;
          margin-bottom: 0.6em;
        }
      `}</style>
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="overflow-hidden"
        >
          <MenuBar editor={editor} />
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
