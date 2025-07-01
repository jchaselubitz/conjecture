import { Metadata, ResolvingMetadata } from 'next';

import { StatementContainer } from '@/containers/StatementContainer';
import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { StatementUpdateProvider } from '@/contexts/StatementUpdateProvider';
import { getUser } from '@/lib/actions/baseActions';
import { getUserRole } from '@/lib/actions/baseActions';
import { getSubscribers } from '@/lib/actions/notificationActions';
import {
  getFullThread,
  getPublishedOrLatest,
  getPublishedStatement,
  getStatementPackage
} from '@/lib/actions/statementActions';
import { UserStatementRoles } from '@/lib/enums/permissions';
import NotFound from '@/components/ui/not_found';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string }>;
  searchParams: Promise<{ edit: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { statementSlug } = await params;
  const statement = await getPublishedStatement(statementSlug);
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: statement?.title,
    description: statement?.subtitle,
    creator: statement?.authors.map(author => author.name).join(', '),
    // keywords: statement?.keywords,
    openGraph: {
      images: [`${statement?.headerImg}`, ...previousImages]
    }
  };
}

export default async function StatementPage({ params, searchParams }: Props) {
  const user = await getUser();
  const userId = user?.id?.toString();
  const { statementSlug, userSlug } = await params;

  const userRole = await getUserRole(userId, statementSlug);
  const userIsCollaborator = userRole !== UserStatementRoles.Viewer;
  const selection = await getPublishedOrLatest(statementSlug, userIsCollaborator);
  const { version: selectedVersion, versionList } = selection ?? {};

  if (!selectedVersion) {
    return (
      <NotFound
        title="Conjecture Not Found"
        message={
          <>
            Sorry, the conjecture you are looking for doesn't exist or has been moved.
            <br />
            You can return to the user's page to explore more conjectures.
          </>
        }
        actions={[{ label: 'Back to User', href: `/${userSlug}`, variant: 'default' }]}
      />
    );
  }

  const statementPackage = await getStatementPackage({
    statementSlug,
    version: selectedVersion
  });

  const thread = statementPackage.threadId ? await getFullThread(statementPackage.threadId) : [];

  const creator = statementPackage.creatorId.toString();
  const isCreator = creator === userId;
  const subscribers = isCreator ? await getSubscribers(creator) : [];

  const { edit } = await searchParams;
  const editMode = edit === 'true';

  return (
    <StatementProvider
      statementPackage={statementPackage}
      userId={userId}
      writerUserSlug={userSlug}
      currentUserRole={userRole}
      thread={thread}
      versionList={versionList ?? []}
      isCreator={isCreator}
      subscribers={subscribers}
    >
      <StatementToolsProvider>
        <StatementAnnotationProvider>
          <StatementUpdateProvider>
            <StatementContainer edit={editMode} />
          </StatementUpdateProvider>
        </StatementAnnotationProvider>
      </StatementToolsProvider>
    </StatementProvider>
  );
}
