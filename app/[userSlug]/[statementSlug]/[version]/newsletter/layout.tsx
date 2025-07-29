import { cookies } from 'next/headers';

import { EditModeProvider } from '@/contexts/EditModeContext';
import { getStatementId } from '@/lib/actions/statementActions';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string }>;
  children: React.ReactNode;
};

export default async function NewsletterLayout({ children, params }: Props) {
  const { statementSlug } = await params;
  const statementId = await getStatementId(statementSlug);
  const cookieStore = await cookies();
  const editModeCookie = cookieStore.get(`edit_${statementId}`);
  const editMode = editModeCookie ? JSON.parse(editModeCookie.value) : false;
  return <EditModeProvider editModeEnabled={editMode}>{children}</EditModeProvider>;
}
