"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useStatementContext } from "@/contexts/statementContext";

interface StatementDetailsProps {
  statementId: string;
}

export default function StatementDetails({
  statementId,
}: StatementDetailsProps) {
  const { drafts } = useStatementContext();

  if (!drafts) {
    return <div>No drafts found</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{drafts[0].title}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDistanceToNow(drafts[0].updatedAt)}
        </p>
      </div>
    </div>
  );
}
