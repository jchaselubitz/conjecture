"use client";

import React from "react";
import { NewStatementCitation } from "kysely-codegen";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useStatementContext } from "@/contexts/statementContext";

import { CitationForm } from "./citation_form";
interface CitationPopoverProps {
  children: React.ReactNode;
  statementId: string;
  creatorId: string;
}

export function CitationPopover({
  statementId,
  creatorId,
  children,
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
        <CitationForm
          statementId={statementId}
          creatorId={creatorId}
          onOpenChange={onOpenChange}
          onClose={onClose}
        />
      </PopoverContent>
    </Popover>
  );
}
