import type { Metadata, ResolvingMetadata } from 'next';

import { StatementContainer } from '@/containers/StatementContainer';
import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { StatementUpdateProvider } from '@/contexts/StatementUpdateProvider';
import { getUser, getUserRole } from '@/lib/actions/baseActions';
import {
  getFullThread,
  getPublishedOrLatest,
  getPublishedStatement,
  getStatementPackage
} from '@/lib/actions/statementActions';
import { UserStatementRoles } from '@/lib/enums/permissions';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string }>;
  searchParams: Promise<{ edit: string; version: string }>;
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
  const { edit, version } = await searchParams;

  const userRole = await getUserRole(userId, statementSlug);
  const userIsCollaborator = userRole !== UserStatementRoles.Viewer;
  const selection = await getPublishedOrLatest(statementSlug);
  const versionNumber = version ? parseInt(version, 10) : selection?.version;

  const statementPackage = await getStatementPackage({
    statementSlug,
    version: userIsCollaborator ? versionNumber : undefined
  });

  const thread = statementPackage.threadId ? await getFullThread(statementPackage.threadId) : [];
  const creator = statementPackage.creatorId.toString();
  const isCreator = creator === userId;
  const editMode = edit === 'true' && isCreator;

  return (
    <StatementProvider
      statementPackage={statementPackage}
      userId={userId}
      writerUserSlug={userSlug}
      currentUserRole={userRole}
      thread={thread}
      versionList={selection?.versionList ?? []}
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
