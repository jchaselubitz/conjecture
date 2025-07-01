import { Metadata, ResolvingMetadata } from 'next';
import { redirect } from 'next/navigation';

import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { StatementUpdateProvider } from '@/contexts/StatementUpdateProvider';
import { getUser, getUserRole } from '@/lib/actions/baseActions';
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
  params: Promise<{ statementSlug: string; userSlug: string; version: string }>;
  children: React.ReactNode;
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

export default async function UserStatementLayout({ children, params }: Props) {
  const user = await getUser();
  const userId = user?.id?.toString();
  const { statementSlug, userSlug, version } = await params;

  const userRole = await getUserRole(userId, statementSlug);
  const userIsCollaborator = userRole !== UserStatementRoles.Viewer;
  const selection = await getPublishedOrLatest(statementSlug, userIsCollaborator);

  const { version: selectedVersion, versionList } = selection ?? {};

  const versionNumber = versionList?.find(
    v => v.versionNumber === parseInt(version, 10)
  )?.versionNumber;

  if (!versionNumber) {
    if (!selectedVersion) {
      return (
        <NotFound
          title="Conjecture Not Found"
          message={
            <>
              Sorry, the conjecture version you are looking for doesn't exist or has been moved.
              <br />
              You can return to the main conjecture page to explore other versions.
            </>
          }
          actions={[
            {
              label: 'Back to Conjecture',
              href: `/${userSlug}/${statementSlug}`,
              variant: 'default'
            }
          ]}
        />
      );
    }
    redirect(`/${userSlug}/${statementSlug}/${selectedVersion}`);
  }

  const statementPackage = await getStatementPackage({
    statementSlug,
    version: userIsCollaborator ? versionNumber : undefined
  });

  const thread = statementPackage.threadId ? await getFullThread(statementPackage.threadId) : [];

  const creator = statementPackage.creatorId.toString();
  const isCreator = creator === userId;
  const subscribers = isCreator ? await getSubscribers(creator) : [];

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
          <StatementUpdateProvider>{children}</StatementUpdateProvider>
        </StatementAnnotationProvider>
      </StatementToolsProvider>
    </StatementProvider>
  );
}
