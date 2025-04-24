import { StatementContainer } from '@/containers/StatementContainer';
import { getDraftsByStatementSlug } from '@/lib/actions/statementActions';
import { createClient } from '@/supabase/server';
export default async function CreatePage({
  params,
  searchParams
}: {
  params: Promise<{ statementSlug: string }>;
  searchParams: Promise<{ edit: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const userId = user?.id?.toString();
  const { statementSlug } = await params;
  const { edit } = await searchParams;

  const drafts = await getDraftsByStatementSlug(statementSlug);
  const creator = drafts[0]?.creatorId.toString();
  const isCreator = creator === userId;
  const editMode = edit === 'true' && isCreator;

  return <StatementContainer edit={editMode} drafts={drafts} />;
}
