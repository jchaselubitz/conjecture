import { cookies } from "next/headers";
import StatementDetails from "@/app/(app)/statements/(components)/statement_details";
import AppNav from "@/components/navigation/app_nav";
import { getDraftsByStatementId } from "@/lib/actions/statementActions";
export default async function CreatePage({
  params,
}: {
  params: Promise<{ statementId: string }>;
}) {
  const { statementId } = await params;
  const drafts = await getDraftsByStatementId(statementId);
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
      <AppNav />
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
