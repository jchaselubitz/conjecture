import Link from 'next/link';
import { Metadata, ResolvingMetadata } from 'next';

import SiteNav from '@/components/navigation/site_nav';
import NotFound from '@/components/ui/not_found';
import RssCopyButton from '@/components/special_buttons/rss_copy_button';
import { StatementListContainer } from '@/containers/StatementListContainer';
import { getUser } from '@/lib/actions/baseActions';
import { getStatementsCached } from '@/lib/actions/statementActions';
import { userProfileCache } from '@/lib/actions/userActions';

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
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return {
    title: `${user?.name} | Conject`,
    description: `${user?.followerCount} ${user?.followerCount === 1 ? 'reader is' : 'readers are'} following ${user?.name}`,

    openGraph: {
      images: [`${user?.imageUrl}`]
    },
    alternates: {
      types: {
        'application/rss+xml': `${baseUrl}/${userSlug}/rss`
      }
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

  const statements = await getStatementsCached({ creatorId: profile.id });

  const permittedStatements = statements.filter(statement => {
    const statementForCollaborator = statement.collaborators.some(
      collaborator => collaborator.userId === user?.id
    );
    const statementIsPublished = !!statement.draft?.publishedAt;
    return statementForCollaborator || statementIsPublished;
  });

  const title = userIsCreator
    ? 'My conjectures'
    : `${profile.name ?? profile.username}'s conjectures`;

  return (
    <>
      <SiteNav />
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">{title}</h1>
          <RssCopyButton
            rssUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${userSlug}/rss`}
          />
        </div>
        <StatementListContainer statements={permittedStatements} pathname={userSlug} />
      </main>
    </>
  );
}
