import { DraftWithAnnotations } from "kysely-codegen";
import { cookies } from "next/headers";
import AppNav from "@/components/navigation/app_nav";
import StatementDetails from "@/components/statements/statement_details";

export async function StatementContainer({
  drafts,
}: {
  drafts: DraftWithAnnotations[];
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

  return (
    <div>
      <div className="flex-1  bg-background  ">
        <StatementDetails
          drafts={drafts}
          authorCommentsEnabled={authorCommentsEnabled}
          readerCommentsEnabled={readerCommentsEnabled}
        />
      </div>
    </div>
  );
}
