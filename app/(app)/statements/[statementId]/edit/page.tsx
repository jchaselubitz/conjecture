import StatementManager from "@/app/(app)/statements/[statementId]/edit/(components)/statement_manager";
import StatementNav from "@/components/navigation/statement_nav";
export default async function CreatePage({
  params,
}: {
  params: Promise<{ statementId: string }>;
}) {
  const paramsObject = await params;
  const statementId = paramsObject.statementId;

  return (
    <div className="flex-1 bg-background">
      <StatementNav />
      <div className="mx-auto container pt-20 px-4">
        <StatementManager statementId={statementId} />
      </div>
    </div>
  );
}
