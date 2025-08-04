import { Metadata, ResolvingMetadata } from 'next';
import { redirect } from 'next/navigation';

import NotFound from '@/components/ui/not_found';
import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { StatementUpdateProvider } from '@/contexts/StatementUpdateProvider';
import { getUser } from '@/lib/actions/baseActions';
import {
  getFullThreadCached,
  getStatementPageDataCached,
  getStatements
} from '@/lib/actions/statementActions';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string; version: string }>;
  children: React.ReactNode;
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
  const { userRole, selection, statementPackage } = await getStatementPageDataCached({
    statementSlug,
    userId,
    version: parseInt(version, 10)
  });

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
              {`Sorry, the conjecture version you are looking for doesn't exist or has been moved.`}
              <br />
              {`You can return to the main conjecture page to explore other versions.`}
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

  if (!statementPackage) {
    return (
      <NotFound
        title="Conjecture Not Found"
        message={`Sorry, the conjecture you are looking for doesn't exist or has been moved.`}
        actions={[{ label: 'Back to User', href: `/${userSlug}`, variant: 'default' }]}
      />
    );
  }

  const thread = statementPackage.threadId
    ? await getFullThreadCached(statementPackage.threadId)
    : [];

  const creator = statementPackage.creatorId.toString();
  const isCreator = creator === userId;

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
          <StatementUpdateProvider>{children}</StatementUpdateProvider>
        </StatementAnnotationProvider>
      </StatementToolsProvider>
    </StatementProvider>
  );
}
