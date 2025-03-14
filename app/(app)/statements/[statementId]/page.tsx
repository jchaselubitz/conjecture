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
  return (
    <div>
      <AppNav />
      <div className="flex-1 mx-auto bg-background container ">
        <div className="container max-w-4xl mx-auto pt-20 px-4">
          <StatementDetails drafts={drafts} />
        </div>
      </div>
    </div>
  );
}
