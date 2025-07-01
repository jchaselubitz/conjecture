import { Editor } from '@tiptap/react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns3,
  LayoutGrid,
  LucideRectangleHorizontal,
  RectangleHorizontalIcon,
  Rows3,
  TableCellsMerge,
  TableProperties,
  Trash2
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TableToolsProps {
  editor: Editor | null;
}

export const TableTools: React.FC<TableToolsProps> = ({ editor }) => {
  if (!editor) return null;
  return (
    <TooltipProvider>
      <div className="flex flex-col md:flex-row md:items-center gap-1 w-full overflow-x-auto justify-between">
        {/* Columns */}
        <div className="flex gap-1 items-center rounded-md border bg-gray-200 p-1 w-fit">
          <span className="text-xs text-muted-foreground p-1">
            <Columns3 className="h-4 w-4" />
          </span>
          <div className="flex flex-row gap-1 items-center bg-muted/90 rounded-md px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Add column before"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add column before</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Add column after"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add column after</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle header column"
                  onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
                >
                  {/* <HeadingIcon className="h-4 w-4" /> */}
                  <TableProperties className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle header column</TooltipContent>
            </Tooltip>{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete column"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete column</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Separator orientation="vertical" className="mx-1 h-6" />
        {/* Rows */}
        <div className="flex gap-1 items-center rounded-md border bg-gray-200 p-1 w-fit">
          <span className="text-xs text-muted-foreground p-1">
            {' '}
            <Rows3 className="h-4 w-4" />
          </span>
          <div className="flex flex-row gap-1 items-center bg-muted/90 rounded-md px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Add row before"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add row before</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Add row after"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add row after</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle header row"
                  onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                >
                  <TableProperties className="h-4 w-4 rotate-270" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle header row</TooltipContent>
            </Tooltip>{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete row"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete row</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Separator orientation="vertical" className="mx-1 h-6 " />
        {/* Cells */}
        <div className="flex gap-1 items-center rounded-md border bg-gray-200 p-1 w-fit">
          <span className="text-xs text-muted-foreground p-1">
            <RectangleHorizontalIcon className="h-4 w-4" />
          </span>
          <div className="flex flex-row gap-1 items-center bg-muted/90 rounded-md px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle header cell"
                  onClick={() => editor.chain().focus().toggleHeaderCell().run()}
                >
                  <LucideRectangleHorizontal className="h-4 w-4 fill-current text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle header cell</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Merge or split"
                  onClick={() => editor.chain().focus().mergeOrSplit().run()}
                >
                  <TableCellsMerge className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Merge or split</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex flex-row gap-1 items-center  bg-gray-200  rounded-md p-1 w-fit">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete table"
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete table</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fix tables"
                onClick={() => editor.chain().focus().fixTables().run()}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fix tables</TooltipContent>
          </Tooltip>
        </div>
        {/* </div> */}
      </div>
    </TooltipProvider>
  );
};
