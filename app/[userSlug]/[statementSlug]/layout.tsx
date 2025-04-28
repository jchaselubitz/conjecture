import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { StatementUpdateProvider } from '@/contexts/StatementUpdateProvider';
import { getUser } from '@/lib/actions/baseActions';
import { getDraftsByStatementSlug } from '@/lib/actions/statementActions';

export default async function UserStatementLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ statementSlug: string }>;
}) {
  const statementSlug = (await params).statementSlug;
  const drafts = await getDraftsByStatementSlug(statementSlug);
  const user = await getUser();
  const userId = user?.id;

  return (
    <StatementProvider drafts={drafts} userId={userId}>
      <StatementToolsProvider>
        <StatementAnnotationProvider>
          <StatementUpdateProvider>
            {/* StatementUpdateProvider should go here */}
            {children}
          </StatementUpdateProvider>
        </StatementAnnotationProvider>
      </StatementToolsProvider>
    </StatementProvider>
  );
}
