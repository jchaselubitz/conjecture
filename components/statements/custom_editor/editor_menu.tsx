import { Editor } from '@tiptap/react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Quote
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import ViewModeButton from '@/components/view_mode_button';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { cn } from '@/lib/utils';

import { CitationButton } from './citation_button';
import { LatexButton } from './latex_button';
interface EditorMenuProps {
  editor: Editor;
  statementId: string;
  editMode: boolean;
  userSlug: string;
  statementSlug: string;
}

export function EditorMenu({
  editor,
  statementId,
  editMode,
  userSlug,
  statementSlug
}: EditorMenuProps) {
  const router = useRouter();
  const { currentVersion } = useStatementContext();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const openLinkDialog = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setIsLinkDialogOpen(true);
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim() === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
    }
    setIsLinkDialogOpen(false);
  };

  const handleLinkCancel = () => {
    setIsLinkDialogOpen(false);
    setLinkUrl('');
  };

  const buttonClassName = 'md:text-zinc-50 hover:text-zinc-600';
  const activeButtonClassName = 'bg-muted md:bg-zinc-500';

  if (editMode) {
    return (
      <>
        <div className="md:bg-zinc-600/85 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg   md:border-zinc-500 border md:border-0 shadow-xl flex items-center w-full mx-auto px-1 mb-2">
          <div className="flex items-center justify-center border-r md:border-zinc-500 h-full">
            <ViewModeButton
              className={cn('flex items-center justify-center ', buttonClassName)}
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
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              className={cn(
                editor.isActive('heading', { level: 4 }) && activeButtonClassName,
                buttonClassName
              )}
            >
              <Heading4 className="h-4 w-4" />
            </Button>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setHardBreak().run()}
              className={cn(editor.isActive('hardBreak') && activeButtonClassName, buttonClassName)}
            >
              <Space className="h-4 w-4" />
            </Button> */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                editor.isActive('bulletList') && activeButtonClassName,
                buttonClassName
              )}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                editor.isActive('orderedList') && activeButtonClassName,
                buttonClassName
              )}
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
              onClick={openLinkDialog}
              className={cn(editor.isActive('link') && activeButtonClassName, buttonClassName)}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>

            <CitationButton editor={editor} statementId={statementId} className={buttonClassName} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn(
                editor.isActive('blockquote') && activeButtonClassName,
                buttonClassName
              )}
            >
              <Quote className="h-4 w-4" />
            </Button>

            <LatexButton editor={editor} displayMode={false} className={buttonClassName} />
          </div>
        </div>

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Link</DialogTitle>
              <DialogDescription>
                Enter the URL you want to link to. Leave empty to remove the link.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="https://example.com"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                className="min-h-20"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleLinkCancel();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <div className="flex gap-2 justify-between w-full">
                {linkUrl.trim() !== '' ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setIsLinkDialogOpen(false);
                    }}
                  >
                    Remove Link
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleLinkCancel}>
                    Cancel
                  </Button>

                  <Button onClick={handleLinkSubmit}>
                    {linkUrl.trim() === '' ? 'Remove Link' : 'Add Link'}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  } else {
    return <></>;
  }
}
