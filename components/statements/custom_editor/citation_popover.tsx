"use client";

import React from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useStatementContext } from "@/contexts/statementContext";

import { CitationDisplay } from "./citation_display";
import { CitationForm } from "./citation_form";
interface CitationPopoverProps {
  children: React.ReactNode;
  statementId: string;
  creatorId: string;
  editMode: boolean;
}

export function CitationPopover({
  statementId,
  creatorId,
  children,
  editMode,
}: CitationPopoverProps) {
  const { citationPopoverOpen, setCitationData, setCitationPopoverOpen } =
    useStatementContext();

  const onClose = () => {
    setCitationPopoverOpen(false);
    setCitationData({
      statementId,
      title: "",
      authorNames: "",
      id: "",
    });
  };

  const onOpenChange = (open: boolean) => {
    setCitationPopoverOpen(open);
    if (!open) {
      onClose();
    }
  };

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
          />
        ) : (
          <CitationDisplay />
        )}
      </PopoverContent>
    </Popover>
  );
}
