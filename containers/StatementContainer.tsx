import { cookies } from 'next/headers';

import StatementLayout from '@/components/statements/statement_layout';
import { balancePanelSizes } from '@/lib/helpers/helpersLayout';

export async function StatementContainer({ edit }: { edit: boolean }) {
  const cookieStore = await cookies();
  const authorCommentCookie = cookieStore.get('show_author_comments');
  const readerCommentCookie = cookieStore.get('show_reader_comments');

  const authorCommentsEnabled = authorCommentCookie ? authorCommentCookie?.value === 'true' : true;
  const readerCommentsEnabled = readerCommentCookie ? readerCommentCookie?.value === 'true' : true;

  const stackCookie =
    cookieStore.get('stack_panel_size')?.value ?? JSON.stringify({ size: 25, isOpen: false });
  const annotationCookie =
    cookieStore.get('annotation_panel_size')?.value ?? JSON.stringify({ size: 30, isOpen: false });
  const panelSizes = balancePanelSizes({ stackCookie, annotationCookie });

  return (
    <div className="md:flex-1 bg-background md:h-screen h-full">
      <StatementLayout
        authorCommentsEnabled={authorCommentsEnabled}
        readerCommentsEnabled={readerCommentsEnabled}
        editModeEnabled={edit ?? false}
        startingPanelSizes={panelSizes}
      />
    </div>
  );
}
