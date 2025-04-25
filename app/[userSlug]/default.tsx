import { Metadata, ResolvingMetadata } from 'next';
import AppNav from '@/components/navigation/app_nav';
import { StatementListContainer } from '@/containers/StatementListContainer';
import { getDrafts } from '@/lib/actions/statementActions';
import { getUserProfile } from '@/lib/actions/userActions';
import { createClient } from '@/supabase/server';

type UserPageProps = {
  params: Promise<{
    userSlug: string;
  }>;
};

export default async function UserDefault({ params }: UserPageProps) {
  const { userSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const userIsCreator = user?.user_metadata.username === userSlug;
  const profile = await getUserProfile(userSlug);

  if (!profile) {
    return <div>User not found</div>;
  }

  const { name, id } = profile;

  const statements = await getDrafts({ creatorId: id, publishedOnly: !userIsCreator });

  return (
    <div>
      <AppNav />
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
