import { DraftWithUser } from 'kysely-codegen';

import { StatementCard } from '@/components/statements/card';
import { StatementCardLoading } from '@/components/statements/card/statement_card';

type Statement = {
  statementId: string;
  drafts: DraftWithUser[];
};

interface StatementListContainerProps {
  statements: Statement[] | { error: string };
  title?: string;
  pathname: string;
}

export function StatementListContainer({
  statements,
  title = 'Statements',
  pathname
}: StatementListContainerProps) {
  if ('error' in statements) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">Please sign in to view your drafts</h3>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between pb-8 ">
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statements.length > 0 ? (
          statements.map(statement => (
            <StatementCard
              key={statement.statementId}
              statement={statement.drafts[0]}
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
    </>
  );
}

export function StatementListContainerLoading() {
  return (
    <>
      <div className="flex items-center justify-between pb-8 ">
        <h1 className="text-3xl font-bold">Statements</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(statement => (
          <StatementCardLoading key={statement} />
        ))}
      </div>
    </>
  );
}
