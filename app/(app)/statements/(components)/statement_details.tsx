"use client";

import { formatDistanceToNow } from "date-fns";
import { BaseDraft } from "kysely-codegen";
import Link from "next/link";
import { useStatementContext } from "@/contexts/statementContext";

interface StatementDetailsProps {
  drafts: BaseDraft[];
  statementId: string;
}

export default function StatementDetails({
  drafts,
  statementId,
}: StatementDetailsProps) {
  const { setStatement } = useStatementContext();
  setStatement(drafts[0]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        {drafts.map((draft) => (
          <Link
            key={draft.id}
            href={`/statements/${statementId}/edit?draft=${draft.id}`}
            className="p-4 rounded-lg border hover:border-foreground/20 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {draft.title || "Untitled Draft"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Last modified{" "}
                  {formatDistanceToNow(draft.updatedAt || draft.createdAt)} ago
                </p>
              </div>
              {draft.isPublished && (
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  Published
                </span>
              )}
            </div>
            {draft.content && (
              <p className="text-muted-foreground mt-2 line-clamp-2">
                {draft.content}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
