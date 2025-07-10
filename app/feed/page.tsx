import { CommentWithStatement } from 'kysely-codegen';

import { StatementCard } from '@/components/statements/card';
import { CommentWithReplies } from '@/components/statements/comment';
import { getUser } from '@/lib/actions/baseActions';
import { getPublicComments } from '@/lib/actions/commentActions';
import { getStatements } from '@/lib/actions/statementActions';
import { nestComments } from '@/lib/helpers/helpersComments';

import CommentFeed from './(components)/comment_feed';

export default async function Feed() {
  const statements = await getStatements({
    forCurrentUser: false,
    publishedOnly: true
  });
  const user = await getUser();
  const draftIds = statements.map(statement => statement.draft?.id);
  const comments = user && (await getPublicComments(draftIds));
  const commentsWithStatement = comments?.map(comment => ({
    ...comment,
    statement: statements.find(statement => statement.draft.id === comment.draftId)
  })) as CommentWithStatement[];

  ///SHOULD THIS ACTUALLY BE ANNOTATIONS?
  const commentWithReplies = nestComments(commentsWithStatement || []) as CommentWithReplies[];

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
            {comments && <CommentFeed nestedComments={commentWithReplies} />}
          </div>
        </div>
      </main>
    </div>
  );
}
