import { StatementContainer } from "@/containers/StatementContainer";
import { getDraftsByStatementId } from "@/lib/actions/statementActions";
export default async function CreatePage({
  params,
}: {
  params: Promise<{ statementId: string }>;
}) {
  const { statementId } = await params;
  const drafts = await getDraftsByStatementId(statementId);

  return <StatementContainer drafts={drafts} />;
}
