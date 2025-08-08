import { redirect } from 'next/navigation';

import NotFound from '@/components/ui/not_found';
import { StatementContainer } from '@/containers/StatementContainer';
import { StatementAnnotationProvider } from '@/contexts/StatementAnnotationContext';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { StatementToolsProvider } from '@/contexts/StatementToolsContext';
import { StatementUpdateProvider } from '@/contexts/StatementUpdateProvider';
import { getUser } from '@/lib/actions/baseActions';
import { getPublishedOrLatestStatements } from '@/lib/actions/statementActions';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string; version: string }>;
};

// export async function generateMetadata(
//   { params }: Props,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   const { statementSlug } = await params;
//   const statement = (await getStatementsCached({ statementSlug }))[0];
//   const previousImages = (await parent).openGraph?.images || [];

//   return {
//     title: statement?.title,
//     description: statement?.subtitle,
//     creator: statement?.authors.map((author: any) => author.name).join(', '),
//     openGraph: {
//       images: [`${statement?.headerImg}`, ...previousImages]
//     },
//     other: {
//       ...(statement?.headerImg && {
//         'link[rel="preload"][as="image"]': statement.headerImg
//       })
//     }
//   };
// }

export default async function StatementPage({ params }: Props) {
  const { statementSlug, userSlug, version } = await params;

  const [user, statements] = await Promise.all([
    getUser(),
    getPublishedOrLatestStatements({
      statementSlug,
      version: parseInt(version, 10)
    })
  ]);

  const userId = user?.id?.toString();
  const statement = statements[0];
  const userIsCollaborator = statement.collaborators.some(
    collaborator => collaborator.userId === userId
  );

  if (!userIsCollaborator) {
    redirect(`/${userSlug}/${statementSlug}`);
  }

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
            <StatementContainer statementSlug={statementSlug} />
          </StatementUpdateProvider>
        </StatementAnnotationProvider>
      </StatementToolsProvider>
    </StatementProvider>
  );
}
