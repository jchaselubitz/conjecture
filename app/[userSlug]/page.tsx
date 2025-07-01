import { Metadata, ResolvingMetadata } from 'next';

import NotFound from '@/components/ui/not_found';
import { StatementListContainer } from '@/containers/StatementListContainer';
import { getStatements } from '@/lib/actions/statementActions';
import { getUserProfile } from '@/lib/actions/userActions';
import { createClient } from '@/supabase/server';

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

  const profile = await getUserProfile(userSlug);
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: profile?.name,
    creator: profile?.name,
    openGraph: {
      images: [profile?.imageUrl ?? '', ...previousImages]
    }
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { userSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const userIsCreator = user?.user_metadata.username === userSlug;
  const profile = await getUserProfile(userSlug);

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

  return (
    <div>
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        <StatementListContainer
          statements={statements}
          title={`My conjectures`}
          pathname={`${userSlug}`}
        />
      </main>
    </div>
  );
}
