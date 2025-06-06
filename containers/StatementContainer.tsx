import { DraftWithAnnotations, DraftWithUser } from 'kysely-codegen';
import { cookies } from 'next/headers';

import StatementLayout from '@/components/statements/statement_layout';
import { Skeleton } from '@/components/ui/skeleton';
import { balancePanelSizes } from '@/lib/helpers/helpersLayout';

export async function StatementContainer({
  drafts,
  edit,
  thread
}: {
  drafts: DraftWithAnnotations[];
  edit: boolean;
  thread: DraftWithUser[];
}) {
  const cookieStore = await cookies();
  const authorCommentCookie = cookieStore.get('show_author_comments');
  const readerCommentCookie = cookieStore.get('show_reader_comments');

  const authorCommentsEnabled = authorCommentCookie ? authorCommentCookie?.value === 'true' : true;
  const readerCommentsEnabled = readerCommentCookie ? readerCommentCookie?.value === 'true' : true;

  const statement = drafts.find(draft => draft.publishedAt !== null) ?? drafts[drafts.length - 1];
  const parentStatement = thread.find(draft => draft.statementId === statement.parentStatementId);

  const stackCookie =
    cookieStore.get('stack_panel_size')?.value ?? JSON.stringify({ size: 25, isOpen: true });
  const annotationCookie =
    cookieStore.get('annotation_panel_size')?.value ?? JSON.stringify({ size: 25, isOpen: true });
  const panelSizes = balancePanelSizes({ stackCookie, annotationCookie });

  return (
    <div className="md:flex-1 bg-background md:h-screen h-full">
      <StatementLayout
        statement={statement}
        authorCommentsEnabled={authorCommentsEnabled}
        readerCommentsEnabled={readerCommentsEnabled}
        editModeEnabled={edit ?? false}
        parentStatement={parentStatement}
        thread={thread}
        startingPanelSizes={panelSizes}
      />
    </div>
  );
}

export async function StatementContainerLoading() {
  return (
    <div className="md:flex-1 bg-background md:h-screen h-full gap-8">
      <Skeleton className="w-full h-96" />
      <Skeleton className="w-full h-24" />
      <div className="flex flex-col gap-2">
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
      </div>
      <Skeleton className="w-full h-12" />
    </div>
  );
}
