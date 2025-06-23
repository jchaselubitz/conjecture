import NewsletterNav from '@/components/navigation/newsletter_nav';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { StatementProvider } from '@/contexts/StatementBaseContext';
import { getUser, getUserRole } from '@/lib/actions/baseActions';
import { getSubscribers } from '@/lib/actions/notificationActions';
import { getPublishedOrLatest, getStatementPackage } from '@/lib/actions/statementActions';
import { UserStatementRoles } from '@/lib/enums/permissions';

import Newsletter from '../(components)/newsletter';

import NewsletterPanel from './(components)/newsletter_panel';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string }>;
  searchParams: Promise<{ edit: string; version: string }>;
};

export default async function NewsletterPage({ params, searchParams }: Props) {
  const user = await getUser();
  const userId = user?.id?.toString();
  const { statementSlug, userSlug } = await params;
  const { version } = await searchParams;
  const userRole = await getUserRole(userId, statementSlug);
  const userIsCollaborator = userRole !== UserStatementRoles.Viewer;
  const selection = await getPublishedOrLatest(statementSlug);
  const versionNumber = version ? parseInt(version, 10) : selection?.version;

  const statementPackage = await getStatementPackage({
    statementSlug,
    version: userIsCollaborator ? versionNumber : undefined
  });

  const creator = statementPackage.creatorId.toString();
  const isCreator = creator === userId;

  const subscribers = isCreator ? await getSubscribers(creator) : [];

  return (
    <StatementProvider
      statementPackage={statementPackage}
      userId={userId}
      writerUserSlug={userSlug}
      currentUserRole={userRole}
      thread={[]}
      versionList={selection?.versionList ?? []}
    >
      {isCreator && <NewsletterNav />}
      <ResizablePanelGroup direction="horizontal" className="fixed w-full top-14">
        <ResizablePanel id="editor" defaultSize={70} minSize={60} className="flex flex-col h-full">
          {isCreator && (
            <div className="bg-blue-50 border border-blue-200 px-4 py-3 mx-4 mt-4 rounded-lg">
              <div className="text-blue-800 font-medium text-center">
                {`This is how your post will appear in your subscriber's email inbox.`}
              </div>
            </div>
          )}

          <Newsletter statement={statementPackage} subscriberEmail={''} />
        </ResizablePanel>
        <ResizableHandle />
        {isCreator && (
          <ResizablePanel id="newsletter" defaultSize={30} minSize={0} className="flex flex-col">
            <NewsletterPanel subscribers={subscribers} />
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </StatementProvider>
  );
}
