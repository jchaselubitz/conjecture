import { DraftWithAnnotations } from "kysely-codegen";
import { cookies } from "next/headers";
import StatementDetails from "@/components/statements/statement_details";

export async function StatementContainer({
  drafts,
}: {
  drafts: DraftWithAnnotations[];
}) {
  const cookieStore = await cookies();
  const authorCommentCookie = cookieStore.get("show_author_comments");
  const readerCommentCookie = cookieStore.get("show_reader_comments");
  const editModeCookie = cookieStore.get("edit_mode");

  const authorCommentsEnabled = authorCommentCookie
    ? authorCommentCookie?.value === "true"
    : true;
  const readerCommentsEnabled = readerCommentCookie
    ? readerCommentCookie?.value === "true"
    : true;
  const editModeEnabled = editModeCookie
    ? editModeCookie?.value === "true"
    : false;

  const statement =
    drafts.find((draft) => draft.publishedAt !== null) ??
    drafts[drafts.length - 1];

  return (
    <div className="flex-1 bg-background ">
      <StatementDetails
        statement={statement}
        authorCommentsEnabled={authorCommentsEnabled}
        readerCommentsEnabled={readerCommentsEnabled}
        editModeEnabled={editModeEnabled}
      />
    </div>
  );
}
