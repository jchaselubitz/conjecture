'use client';

import { Editor } from '@tiptap/react';
import React from 'react';
import { useWindowSize } from 'react-use';
import { DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Drawer } from '@/components/ui/drawer';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';

import { CitationDisplay } from './citation_display';
import { CitationForm } from './citation_form';
interface CitationPopoverProps {
  children: React.ReactNode;
  statementId: string;
  creatorId: string;
  editMode: boolean;
  editor?: Editor | null;
}

export function CitationPopover({
  statementId,
  creatorId,
  children,
  editMode,
  editor
}: CitationPopoverProps) {
  const { citationPopoverOpen, setCitationData, setCitationPopoverOpen } =
    useStatementToolsContext();

  const isMobile = useWindowSize().width < 600;

  const onClose = () => {
    setCitationPopoverOpen(false);
    setCitationData({
      statementId,
      title: '',
      authorNames: '',
      id: ''
    });
  };

  const onOpenChange = (open: boolean) => {
    setCitationPopoverOpen(open);
    if (!open) {
      onClose();
    }
  };

  if (isMobile) {
    return (
      //make this a full screen drawer
      <Drawer open={citationPopoverOpen} onOpenChange={onOpenChange}>
        <DrawerContent className=" max-h-[50dvh]">
          <DrawerTitle className="sr-only">Citation</DrawerTitle>
          {editMode ? (
            <div className="flex flex-col overflow-y-auto h-full">
              <CitationForm
                statementId={statementId}
                creatorId={creatorId}
                onOpenChange={onOpenChange}
                onClose={onClose}
                editor={editor}
              />
            </div>
          ) : (
            <div className="flex flex-col overflow-y-auto h-full">
              <CitationDisplay />
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  } else {
    return (
      <Popover open={citationPopoverOpen} onOpenChange={onOpenChange}>
        <PopoverAnchor asChild>{children}</PopoverAnchor>
        <PopoverContent className="w-screen max-w-[450px] p-0" align="start">
          {editMode ? (
            <CitationForm
              statementId={statementId}
              creatorId={creatorId}
              onOpenChange={onOpenChange}
              onClose={onClose}
              editor={editor}
            />
          ) : (
            <CitationDisplay />
          )}
        </PopoverContent>
      </Popover>
    );
  }
}
