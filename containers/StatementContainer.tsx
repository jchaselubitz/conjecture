import { DraftWithAnnotations } from "kysely-codegen";
import { cookies } from "next/headers";
import StatementLayout from "@/components/statements/statement_layout";
import { getPublishedStatement } from "@/lib/actions/statementActions";
export async function StatementContainer({
  drafts,
  edit,
}: {
  drafts: DraftWithAnnotations[];
  edit: boolean;
}) {
  const cookieStore = await cookies();
  const authorCommentCookie = cookieStore.get("show_author_comments");
  const readerCommentCookie = cookieStore.get("show_reader_comments");

  const authorCommentsEnabled = authorCommentCookie
    ? authorCommentCookie?.value === "true"
    : true;
  const readerCommentsEnabled = readerCommentCookie
    ? readerCommentCookie?.value === "true"
    : true;

  const statement =
    drafts.find((draft) => draft.publishedAt !== null) ??
    drafts[drafts.length - 1];

  const parentStatement = statement.parentStatementId
    ? await getPublishedStatement(statement.parentStatementId)
    : null;

  return (
    <div className="md:flex-1 bg-background md:h-screen h-full">
      <StatementLayout
        statement={statement}
        authorCommentsEnabled={authorCommentsEnabled}
        readerCommentsEnabled={readerCommentsEnabled}
        editModeEnabled={edit ?? false}
        parentStatement={parentStatement}
      />
    </div>
  );
}
