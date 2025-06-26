import Table from '@tiptap/extension-table';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  NodeViewProps,
  NodeViewContent
} from '@tiptap/react';
import React, { useState, useRef } from 'react';
import { TableTools } from '../table_tools';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Wrench } from 'lucide-react';

const TableWithToolsComponent = (props: NodeViewProps & { editMode?: boolean }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const showButton = props.editMode;

  return (
    <NodeViewWrapper className="relative group flex flex-col">
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
      <NodeViewContent
        as="table"
        {...props.HTMLAttributes}
        className={props.HTMLAttributes.class}
        style={props.HTMLAttributes.style}
      >
        {/* {(() => {
          // Find the first row in the table node
          const tableNode = props.node;
          const firstRow = tableNode?.content?.content?.find(
            child => child.type?.name === 'tableRow'
          );

          const colCount = firstRow?.content?.content?.length || 1;
          return (
            <colgroup>
              {Array.from({ length: colCount }).map((_, i) => (
                <col key={i} style={{ minWidth: '25px' }} />
              ))}
            </colgroup>
          );
        })()} */}
      </NodeViewContent>
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
