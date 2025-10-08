import SiteNav from '@/components/navigation/site_nav';
import NotFound from '@/components/ui/not_found';
import { StatementListContainer } from '@/containers/StatementListContainer';
import { getUser } from '@/lib/actions/baseActions';
import { getStatementsCached } from '@/lib/actions/statementActions';
import { userProfileCache } from '@/lib/actions/userActions';
import { Metadata, ResolvingMetadata } from 'next';

type UserPageProps = {
  params: Promise<{
    userSlug: string;
  }>;
};

export async function generateMetadata(
  { params }: UserPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { userSlug } = await params;
  const user = await userProfileCache(userSlug);
  return {
    title: user?.name,
    description: `${user?.followerCount} ${user?.followerCount === 1 ? 'reader is' : 'readers are'} following ${user?.name}`,

    openGraph: {
      images: [`${user?.imageUrl}`]
    },
    other: {
      ...(user?.imageUrl && {
        'link[rel="preload"][as="image"]': user.imageUrl
      })
    }
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { userSlug } = await params;
  const user = await getUser();
  const profile = await userProfileCache(userSlug);
  const userIsCreator = user?.user_metadata.username === userSlug;

  const statements = await getStatementsCached({ creatorId: profile?.id });

  const permittedStatements = statements.filter(statement => {
    const statementForCollaborator = statement.collaborators.some(
      collaborator => collaborator.userId === user?.id
    );
    const statementIsPublished = !!statement.draft?.publishedAt;
    return statementForCollaborator || statementIsPublished;
  });

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
        <StatementListContainer statements={permittedStatements} pathname={userSlug} />
      </main>
    </>
  );
}
