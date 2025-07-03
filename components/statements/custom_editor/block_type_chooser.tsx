import { Editor } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Plus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

import { ImageButton } from './image_button';
import { LatexButton } from './latex_button';
import { VideoButton } from './video_button';

interface BlockTypeChooserProps {
  statementId: string;
  editor: Editor | null;
}

export function BlockTypeChooser({ statementId, editor }: BlockTypeChooserProps) {
  if (!editor) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-7 w-7 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto bg-background border shadow-lg" align="start">
        <div className="flex items-center gap-1 rounded-lg p-1 w-fit">
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(editor.isActive('heading', { level: 1 }) && 'bg-muted')}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(editor.isActive('heading', { level: 2 }) && 'bg-muted')}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(editor.isActive('heading', { level: 3 }) && 'bg-muted')}
          >
            <Heading3 className="h-4 w-4" />
          </Button> */}
          <Button
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive('bulletList') && 'bg-muted')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              editor.chain().focus().toggleOrderedList().run();
              console.log('orderedList');
            }}
            className={cn(editor.isActive('orderedList') && 'bg-muted')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(editor.isActive('blockquote') && 'bg-muted')}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <LatexButton editor={editor} displayMode={true} />
          <VideoButton statementId={statementId} />
          <ImageButton statementId={statementId} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
