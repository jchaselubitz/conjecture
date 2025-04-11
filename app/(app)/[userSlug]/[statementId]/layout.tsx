import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/statementContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { getUser } from '@/lib/actions/baseActions';
import { getDraftsByStatementId } from '@/lib/actions/statementActions';

export default async function UserStatementLayout({
  children,
  params
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
      <StatementToolsProvider>
        <StatementAnnotationProvider>{children}</StatementAnnotationProvider>
      </StatementToolsProvider>
    </StatementProvider>
  );
}
