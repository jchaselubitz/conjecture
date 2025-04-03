import { BaseStatementCitation } from "kysely-codegen";
import React from "react";
import { cn } from "@/lib/utils";

import { Footnote } from "./footnote";

interface FootnoteListProps {
  citations: BaseStatementCitation[];
  className?: string;
}

export function FootnoteList({ citations, className }: FootnoteListProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold border-b pb-2">References</h3>
      <div className="space-y-4">
        {citations.map((citation, index) => (
          <Footnote
            key={citation.id}
            order={index + 1}
            citation={citation}
            anchorId={`citation-${citation.id}`}
          />
        ))}
      </div>
    </div>
  );
}
