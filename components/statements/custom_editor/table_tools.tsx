import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import React from 'react';

interface TableToolsProps {
  editor: Editor | null;
}

export const TableTools: React.FC<TableToolsProps> = ({ editor }) => {
  if (!editor) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        Add Table
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
      >
        Add column before
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        Add column after
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        Delete column
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().addRowBefore().run()}
      >
        Add row before
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        Add row after
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor.chain().focus().deleteRow().run()}>
        Delete row
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        Delete table
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor.chain().focus().mergeCells().run()}>
        Merge cells
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor.chain().focus().splitCell().run()}>
        Split cell
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
      >
        Toggle header column
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
      >
        Toggle header row
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeaderCell().run()}
      >
        Toggle header cell
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().mergeOrSplit().run()}
      >
        Merge or split
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().setCellAttribute('colspan', 2).run()}
      >
        Set cell attribute
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor.chain().focus().fixTables().run()}>
        Fix tables
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().goToNextCell().run()}
      >
        Go to next cell
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().goToPreviousCell().run()}
      >
        Go to previous cell
      </Button>
    </div>
  );
};
