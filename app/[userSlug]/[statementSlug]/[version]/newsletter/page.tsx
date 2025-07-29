'use client';
import NewsletterNav from '@/components/navigation/newsletter_nav';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useStatementContext } from '@/contexts/StatementBaseContext';

import Newsletter from './(components)/newsletter';
import NewsletterPanel from './(components)/newsletter_panel';

export default function NewsletterPage() {
  const { isCreator } = useStatementContext();

  return (
    <>
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

          {/* Newsletter Preview (iframe) */}
          <Newsletter />
        </ResizablePanel>
        <ResizableHandle />
        {isCreator && (
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
