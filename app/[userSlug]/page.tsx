import { BaseProfile } from 'kysely-codegen';

import { cache } from 'react';

import SiteNav from '@/components/navigation/site_nav';
import NotFound from '@/components/ui/not_found';
import { StatementListContainer } from '@/containers/StatementListContainer';
import { getUser } from '@/lib/actions/baseActions';
import { getStatements } from '@/lib/actions/statementActions';
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

// export async function generateMetadata(
//   { params }: UserPageProps,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   const { userSlug } = await params;

//   const profile = await userProfileCache(userSlug);
//   const previousImages = (await parent).openGraph?.images || [];

//   return {
//     title: profile?.name,
//     creator: profile?.name,
//     openGraph: {
//       images: [profile?.imageUrl ?? '', ...previousImages]
//     }
//   };
// }

export default async function UserPage({ params }: UserPageProps) {
  const { userSlug } = await params;

  // Get user first, then use it to get profile efficiently
  const user = await getUser();
  const profile = await userProfileCache(userSlug, user);

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

  const { id } = profile;

  const statements = await getStatements({ creatorId: id, publishedOnly: !userIsCreator });

  const title = userIsCreator
    ? 'My conjectures'
    : `${profile.name ?? profile.username}'s conjectures`;

  return (
    <>
      <SiteNav />
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        <StatementListContainer statements={statements} title={title} pathname={`${userSlug}`} />
      </main>
    </>
  );
}
