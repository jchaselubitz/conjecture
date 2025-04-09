import { StatementProvider } from "@/contexts/statementContext";
import { getUser } from "@/lib/actions/baseActions";
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
  const user = await getUser();
  const userId = user?.id;

  return (
    <StatementProvider drafts={drafts} userId={userId}>
      {children}
    </StatementProvider>
  );
}
