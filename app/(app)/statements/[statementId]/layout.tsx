import { StatementProvider } from "@/contexts/statementContext";
import { getAnnotationsForDraft } from "@/lib/actions/annotationActions";
import { getDraftsByStatementId } from "@/lib/actions/statementActions";

export default async function CreateLayout({
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
