import { StatementProvider } from "@/contexts/statementContext";
import { getDraftsByStatementId } from "@/lib/actions/statementActions";

export default async function UserStatementLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ statementId: string }>;
}) {
  const statementId = (await params).statementId;
  const drafts = await getDraftsByStatementId(statementId);

  return <StatementProvider drafts={drafts}>{children}</StatementProvider>;
}
