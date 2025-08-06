import { SubscriptionWithRecipient } from 'kysely-codegen';

import NewsletterNav from '@/components/navigation/newsletter_nav';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { getUser } from '@/lib/actions/baseActions';
import { getSubscribersCached } from '@/lib/actions/notificationActions';
import { getStatementsCached } from '@/lib/actions/statementActions';
import { UserStatementRoles } from '@/lib/enums/permissions';

import Newsletter from './(components)/newsletter';
import NewsletterPanel from './(components)/newsletter_panel';

export default async function NewsletterPage({
  params
}: {
  params: Promise<{ statementSlug: string }>;
}) {
  const { statementSlug } = await params;

  const user = await getUser();

  let subscribers: SubscriptionWithRecipient[] = [];
  const statements = await getStatementsCached({
    statementSlug,
    publishedOnly: true
  });

  const statement = statements[0];

  const userRole = statement?.collaborators.find(collaborator => collaborator.userId === user?.id)
    ?.role as UserStatementRoles | undefined;

  const isAuthor = userRole === UserStatementRoles.Author;

  if (statement && isAuthor) {
    subscribers = await getSubscribersCached(user?.id ?? '');
  }

  return (
    <>
      {isAuthor && <NewsletterNav statement={statement} />}
      <ResizablePanelGroup direction="horizontal" className="fixed w-full top-14">
        <ResizablePanel id="editor" defaultSize={70} minSize={60} className="flex flex-col h-full">
          {isAuthor && (
            <div className="bg-blue-50 border border-blue-200 px-4 py-3 mx-4 mt-4 rounded-lg">
              <div className="text-blue-800 font-medium text-center">
                {`This is how your post will appear in your subscriber's email inbox.`}
              </div>
            </div>
          )}

          {/* Newsletter Preview (iframe) */}
          {statement && (
            <Newsletter statement={statement} isAuthor={isAuthor} subscribers={subscribers} />
          )}
        </ResizablePanel>
        <ResizableHandle />
        {isAuthor && (
          <ResizablePanel
            id="newsletter"
            defaultSize={30}
            minSize={0}
            className="hidden md:flex flex-col"
          >
            <NewsletterPanel />
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </>
  );
}
