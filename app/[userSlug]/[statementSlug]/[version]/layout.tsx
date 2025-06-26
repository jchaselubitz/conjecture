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

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string; version: string }>;
  children: React.ReactNode;
};

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
    if (selectedVersion) {
      redirect(`/${userSlug}/${statementSlug}/${selectedVersion}`);
    } else {
      return <div>No version found</div>;
    }
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
