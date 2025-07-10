import { StatementCard } from '@/components/statements/card';
import { getAnnotations } from '@/lib/actions/commentActions';
import { getStatements } from '@/lib/actions/statementActions';

import AnnotationFeed from './(components)/annotation_feed';

export default async function Feed() {
  const statements = await getStatements({
    forCurrentUser: false,
    publishedOnly: true
  });

  const statementAndDraftIds = statements.map(statement => ({
    draftId: statement.draft?.id,
    statementId: statement.statementId,
    statementSlug: statement.slug ?? '',
    creatorSlug: statement.creatorSlug ?? '',
    versionNumber: statement.draft?.versionNumber ?? 1
  }));
  const annotations = await getAnnotations(statementAndDraftIds);

  if ('error' in statements) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container max-w-4xl pt-20 px-4">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">Please sign in to view your feed</h3>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen ">
      <main className="flex-1 mx-auto bg-background container px-4 md:px-0 ">
        <div className="flex items-center justify-between my-8">
          <h1 className="text-3xl font-bold">Feed</h1>
        </div>
        <div className="flex gap-6 ">
          <div className="flex flex-col gap-6 max-w-xl ">
            {statements.length > 0 ? (
              statements.map(statement => (
                <StatementCard
                  key={statement.statementId}
                  statement={statement}
                  isPublic={true}
                  pathname={statement.creatorSlug ?? ''}
                />
              ))
            ) : (
              <div className="text-center py-12 col-span-full">
                <h3 className="text-lg font-medium">No content in your feed yet</h3>
                <p className="text-muted-foreground mt-1">
                  Subscribe to users to see their statements in your feed
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col  max-w-md mx-auto">
            {annotations && <AnnotationFeed annotations={annotations} />}
          </div>
        </div>
      </main>
    </div>
  );
}
