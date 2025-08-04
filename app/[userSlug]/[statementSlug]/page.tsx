import { Metadata, ResolvingMetadata } from 'next';

import NotFound from '@/components/ui/not_found';
import { StatementContainer } from '@/containers/StatementContainer';
import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { StatementUpdateProvider } from '@/contexts/StatementUpdateProvider';
import { getUser } from '@/lib/actions/baseActions';
import {
  getFullThreadCached,
  getStatementPageDataCached,
  getStatementsCached
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

  // Use cached version for better performance
  console.time('generateMetadataBasePage');
  const statement = (await getStatementsCached({ statementSlug, publishedOnly: true }))[0];
  const previousImages = (await parent).openGraph?.images || [];
  console.timeEnd('generateMetadataBasePage');
  return {
    title: statement?.title,
    description: statement?.subtitle,
    creator: statement?.authors.map((author: any) => author.name).join(', '),
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
  const { statementSlug, userSlug } = await params;
  console.time('StatementPage');
  // Parallel data fetching for better performance
  const [user, { userRole, selection, statementPackage }] = await Promise.all([
    getUser(),
    getStatementPageDataCached({
      statementSlug,
      userId: undefined // We'll get this from user.id below
    })
  ]);
  console.timeEnd('StatementPage');
  const userId = user?.id?.toString();

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
  const statementId = statementPackage.statementId;
  const creator = statementPackage.creatorId.toString();
  const isCreator = creator === userId;

  // Parallelize independent data fetching operations
  const thread = statementPackage.threadId
    ? await getFullThreadCached(statementPackage.threadId)
    : [];

  return (
    <StatementProvider
      statementPackage={statementPackage}
      userId={userId}
      writerUserSlug={userSlug}
      thread={thread}
      versionList={versionList ?? []}
      isCreator={isCreator}
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
