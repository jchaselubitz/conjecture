import { Metadata, ResolvingMetadata } from 'next';

import NotFound from '@/components/ui/not_found';
import { StatementContainer } from '@/containers/StatementContainer';
import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { StatementUpdateProvider } from '@/contexts/StatementUpdateProvider';
import { getUser } from '@/lib/actions/baseActions';
import { getStatementsCached } from '@/lib/actions/statementActions';

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
  const statement = (await getStatementsCached({ statementSlug, publishedOnly: true }))[0];
  const previousImages = (await parent).openGraph?.images || [];

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
  const { edit } = await searchParams;
  const [user, statements] = await Promise.all([
    getUser(),
    getStatementsCached({
      statementSlug,
      publishedOnly: true
    })
  ]);

  const statement = statements[0];
  const userId = user?.id?.toString();

  if (!statement) {
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

  const creator = statement.creatorId.toString();
  const isCreator = creator === userId;

  return (
    <StatementProvider
      statement={statement}
      userId={userId}
      writerUserSlug={userSlug}
      isCreator={isCreator}
      versionList={statement.versionList}
    >
      <StatementToolsProvider>
        <StatementAnnotationProvider>
          <StatementUpdateProvider>
            <StatementContainer editMode={edit === 'true'} />
          </StatementUpdateProvider>
        </StatementAnnotationProvider>
      </StatementToolsProvider>
    </StatementProvider>
  );
}
