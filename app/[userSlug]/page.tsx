import { BaseProfile } from 'kysely-codegen';
import { cache } from 'react';
import { Suspense } from 'react';

import SiteNav from '@/components/navigation/site_nav';
import NotFound from '@/components/ui/not_found';
import { Skeleton } from '@/components/ui/skeleton';
import { StatementListContainer } from '@/containers/StatementListContainer';
import { getUser } from '@/lib/actions/baseActions';
import { getStatementsCached } from '@/lib/actions/statementActions';
import { getUserProfileBySlug } from '@/lib/actions/userActions';

type UserPageProps = {
  params: Promise<{
    userSlug: string;
  }>;
};

const userProfileCache = cache(
  async (userSlug: string, user?: any): Promise<BaseProfile | null | undefined> => {
    return await getUserProfileBySlug(userSlug, user);
  }
);

// Async component for loading statements
async function StatementsListLoader({
  creatorId,
  publishedOnly,
  userSlug
}: {
  creatorId: string;
  publishedOnly: boolean;
  userSlug: string;
}) {
  const statements = await getStatementsCached({ creatorId, publishedOnly });
  return <StatementListContainer statements={statements} pathname={userSlug} />;
}

// Loading component for statements
function StatementsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted rounded animate-pulse" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}

export default async function UserPage({ params }: UserPageProps) {
  const { userSlug } = await params;

  // Parallel data fetching for better performance
  const [user, profile] = await Promise.all([getUser(), userProfileCache(userSlug)]);

  const userIsCreator = user?.user_metadata.username === userSlug;

  if (!profile) {
    return (
      <NotFound
        title="Writer Not Found"
        message={
          <>
            {` Sorry, the writer you are looking for doesn't exist or has been moved. `}
            <br />
            {`You can return to the feed to explore more conjectures.`}
          </>
        }
        actions={[{ label: 'Back to Feed', href: '/feed', variant: 'default' }]}
      />
    );
  }

  const title = userIsCreator
    ? 'My conjectures'
    : `${profile.name ?? profile.username}'s conjectures`;

  return (
    <>
      <SiteNav />
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        <Suspense fallback={<StatementsLoading />}>
          <StatementsListLoader
            creatorId={profile.id}
            publishedOnly={!userIsCreator}
            userSlug={userSlug}
          />
        </Suspense>
      </main>
    </>
  );
}
