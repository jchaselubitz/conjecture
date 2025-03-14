"use client";

import Link from "next/link";
import RichTextDisplay from "@/components/statements/rich_text_display";
import { Button } from "@/components/ui/button";
import { useStatementContext } from "@/contexts/statementContext";
import { DraftWithAnnotations } from "kysely-codegen";
import Byline from "./byline";

interface StatementDetailsProps {
  drafts: DraftWithAnnotations[];
}

export default function StatementDetails({ drafts }: StatementDetailsProps) {
  const { setAnnotations } = useStatementContext();

  if (!drafts) {
    return <div>No drafts found</div>;
  }
  const statement =
    drafts.find((draft) => draft.publishedAt !== null) ??
    drafts[drafts.length - 1];

  const { title, subtitle, content, versionNumber, annotations } = statement;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>

          <Link
            href={`/statements/${statement.statementId}/edit?version=${versionNumber}`}
          >
            <Button variant="outline">Edit</Button>
          </Link>
        </div>
        <h2 className="text-xl font-medium  text-zinc-600">{subtitle}</h2>
        <Byline statement={statement} />

        <div className="flex flex-col gap-4 mt-3">
          {content && (
            <RichTextDisplay
              htmlContent={content}
              draftId={statement.id}
              statementId={statement.statementId}
              annotations={annotations}
              setAnnotations={setAnnotations}
              statementCreatorId={statement.creatorId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
