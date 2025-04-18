import { Editor } from '@tiptap/react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Pencil,
  Quote
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWindowSize } from 'react-use';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ViewModeButton from '@/components/view_mode_button';
import { cn } from '@/lib/utils';

import { CitationButton } from './citation_button';
import { LatexButton } from './latex_button';
interface EditorMenuProps {
  editor: Editor;
  statementId: string;
  editMode: boolean;
}

export function EditorMenu({ editor, statementId, editMode }: EditorMenuProps) {
  const router = useRouter();

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const buttonClassName = 'md:text-zinc-50 hover:text-zinc-600';
  const activeButtonClassName = 'bg-muted md:bg-zinc-500';

  if (editMode) {
    return (
      <div className="md:bg-zinc-600/85 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg   md:border-zinc-500 border md:border-0 shadow-xl flex items-center w-full mx-auto px-1 mb-2">
        <div className="flex items-center justify-center border-r md:border-zinc-500 h-full">
          <ViewModeButton
            className={cn('flex items-center justify-center ', buttonClassName)}
            handleEditModeToggle={() => router.push(`/[userSlug]/${statementId}`)}
            iconOnly={true}
            variant="ghost"
          />
        </div>

        <div className="flex gap-2 p-2 overflow-x-auto ">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive('bold') && activeButtonClassName, buttonClassName)}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive('italic') && activeButtonClassName, buttonClassName)}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              editor.isActive('heading', { level: 1 }) && activeButtonClassName,
              buttonClassName
            )}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              editor.isActive('heading', { level: 2 }) && activeButtonClassName,
              buttonClassName
            )}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              editor.isActive('heading', { level: 3 }) && activeButtonClassName,
              buttonClassName
            )}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive('bulletList') && activeButtonClassName, buttonClassName)}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive('orderedList') && activeButtonClassName, buttonClassName)}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div>
            <Separator orientation="vertical" className="md:bg-zinc-500" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(editor.isActive('codeBlock') && activeButtonClassName, buttonClassName)}
          >
            <Code className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={cn(editor.isActive('link') && activeButtonClassName, buttonClassName)}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <CitationButton editor={editor} statementId={statementId} className={buttonClassName} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(editor.isActive('blockquote') && activeButtonClassName, buttonClassName)}
          >
            <Quote className="h-4 w-4" />
          </Button>

          <LatexButton editor={editor} displayMode={false} className={buttonClassName} />
        </div>
      </div>
    );
  } else {
    return <></>;
  }
}
