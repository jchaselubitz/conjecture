import { Metadata, ResolvingMetadata } from 'next';

import NotFound from '@/components/ui/not_found';
import { StatementContainer } from '@/containers/StatementContainer';
import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { StatementUpdateProvider } from '@/contexts/StatementUpdateProvider';
import { getUser } from '@/lib/actions/baseActions';
import { getSubscribersCached } from '@/lib/actions/notificationActions';
import {
  getFullThreadCached,
  getStatementPageDataCached,
  getStatements
} from '@/lib/actions/statementActions';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string }>;
  searchParams: Promise<{ edit: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { statementSlug } = await params;
  const statement = (await getStatements({ statementSlug, publishedOnly: true }))[0];
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: statement?.title,
    description: statement?.subtitle,
    creator: statement?.authors.map((author: any) => author.name).join(', '),
    // keywords: statement?.keywords,
    openGraph: {
      images: [`${statement?.headerImg}`, ...previousImages]
    },
    other: {
      ...(statement?.headerImg && {
        'link[rel="preload"][as="image"]': statement.headerImg
      })
    }
  };
}

export default async function StatementPage({ params, searchParams }: Props) {
  const user = await getUser();
  const userId = user?.id?.toString();
  const { statementSlug, userSlug } = await params;

  // Use the cached version for better performance
  const { userRole, selection, statementPackage } = await getStatementPageDataCached({
    statementSlug,
    userId
  });

  if (!selection || !statementPackage) {
    return (
      <NotFound
        title="Conjecture Not Found"
        message={
          <>
            {`Sorry, the conjecture you are looking for doesn't exist or has been moved.`}
            <br />
            {`You can return to the user's page to explore more conjectures.`}
          </>
        }
        actions={[{ label: 'Back to User', href: `/${userSlug}`, variant: 'default' }]}
      />
    );
  }

  const { version: selectedVersion, versionList } = selection;

  // Parallelize independent data fetching operations
  const [thread, subscribers] = await Promise.all([
    statementPackage.threadId
      ? getFullThreadCached(statementPackage.threadId)
      : Promise.resolve([]),
    (() => {
      const creator = statementPackage.creatorId.toString();
      const isCreator = creator === userId;
      return isCreator ? getSubscribersCached(creator) : Promise.resolve([]);
    })()
  ]);

  const statementId = statementPackage.statementId;
  const creator = statementPackage.creatorId.toString();
  const isCreator = creator === userId;

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
            <StatementContainer statementId={statementId} />
          </StatementUpdateProvider>
        </StatementAnnotationProvider>
      </StatementToolsProvider>
    </StatementProvider>
  );
}
