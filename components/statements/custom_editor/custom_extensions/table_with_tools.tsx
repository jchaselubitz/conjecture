import { Table } from '@tiptap/extension-table';
import {
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer
} from '@tiptap/react';
import { Wrench } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { TableTools } from '../table_tools';

const TableWithToolsComponent = (props: NodeViewProps & { editMode?: boolean }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const showButton = props.editMode;

  return (
    <NodeViewWrapper className="relative group flex flex-col mb-4">
      {showButton && (
        <div className="absolute left-0 top-0 z-10">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                ref={buttonRef}
                className="table-tools-btn opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded shadow p-1 m-1 flex items-center"
                tabIndex={-1}
                aria-label="Table tools"
                onClick={e => {
                  e.stopPropagation();
                  setOpen(!open);
                }}
              >
                <Wrench className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="bottom" align="start">
              <TableTools editor={props.editor} />
            </PopoverContent>
          </Popover>
        </div>
      )}
      {/* <table className="w-full"> */}
      <NodeViewContent
        as="table"
        {...props.HTMLAttributes}
        className={props.HTMLAttributes.class}
        style={props.HTMLAttributes.style}
      />
      {/* </table> */}
    </NodeViewWrapper>
  );
};

export const TableWithTools = Table.extend({
  addNodeView() {
    return ReactNodeViewRenderer(
      props => <TableWithToolsComponent {...props} editMode={props.editor.isEditable} />,
      { contentDOMElementTag: 'tBody' }
    );
  }
});
