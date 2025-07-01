import { Table, TableOptions } from '@tiptap/extension-table';
import {
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer
} from '@tiptap/react';
import React, { useState } from 'react';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { TableTools } from '../table_tools';

const TableWithToolsComponent = (props: NodeViewProps & { editMode: boolean }) => {
  const [showTools, setShowTools] = useState(false);
  const showSwitch = props.editMode;

  return (
    <NodeViewWrapper className="relative group flex flex-col mb-4">
      <div
        className={cn(
          'flex flex-col items-center gap-1 bg-muted/60  shadow-sm w-full overflow-x-auto',
          showSwitch && 'rounded-md px-2 py-1 pb-2 border border-muted'
        )}
      >
        {showSwitch && (
          <div className=" left-0 -top-8 z-20 flex w-full m-1 gap-2">
            <Switch checked={showTools} onCheckedChange={setShowTools} />
            <span className="text-xs text-muted-foreground">Table tools</span>
          </div>
        )}
        {showSwitch && showTools && (
          <div className="z-20 w-full">
            <TableTools editor={props.editor} />
          </div>
        )}
      </div>
      <NodeViewContent
        // @ts-expect-error this is a valid attribute
        as="table"
        {...props.HTMLAttributes}
        className={props.HTMLAttributes.class}
        style={props.HTMLAttributes.style}
      />
    </NodeViewWrapper>
  );
};

export interface TableWithToolsOptions extends TableOptions {
  editMode?: boolean;
}

export const TableWithTools = Table.extend<TableWithToolsOptions>({
  addNodeView() {
    // Use a key to force re-render when editMode changes
    const editMode = (this.options as any).editMode;
    return ReactNodeViewRenderer(
      props => (
        <TableWithToolsComponent {...props} editMode={editMode} key={editMode ? 'edit' : 'view'} />
      ),
      {
        contentDOMElementTag: 'tBody'
      }
    );
  }
});
