import StatementCreateEditForm from "@/app/(app)/statements/(components)/create_edit_form";
import StatementNav from "@/components/navigation/statement_nav";
import { getDraftById } from "@/lib/actions/statementActions";
export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ statementId: string }>;
  searchParams: Promise<{ draft: string }>;
}) {
  const paramsObject = await params;
  const statementId = paramsObject.statementId;

  const { draft: id } = await searchParams;

  const draft = await getDraftById(id);

  return (
    <div className="flex-1 bg-background   ">
      <StatementNav />
      <div className="mx-auto container pt-20 px-4">
        <StatementCreateEditForm statementId={statementId} draft={draft} />
      </div>
    </div>
  );
}
