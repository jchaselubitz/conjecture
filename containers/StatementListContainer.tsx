import { StatementWithDraftAndCollaborators } from 'kysely-codegen';

import { StatementCard } from '@/components/statements/card';

interface StatementListContainerProps {
  statements: StatementWithDraftAndCollaborators[] | { error: string };
  title?: string;
  pathname: string;
}

export function StatementListContainer({ statements, pathname }: StatementListContainerProps) {
  if ('error' in statements) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">Please sign in to view your drafts</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statements.length > 0 ? (
        statements.map((statement, i) => (
          <StatementCard
            key={statement.statementId + i}
            statement={statement}
            pathname={pathname}
          />
        ))
      ) : (
        <div className="text-center py-12 col-span-full">
          <h3 className="text-lg font-medium">No drafts yet</h3>
          <p className="text-muted-foreground mt-1">Create a new draft to get started</p>
        </div>
      )}
    </div>
  );
}
