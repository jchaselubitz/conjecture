import { cookies } from 'next/headers';
import { Suspense } from 'react';

import { EditModeProvider } from '@/contexts/EditModeContext';
import { NewsletterProvider } from '@/contexts/NewsletterContext';
import { getSubscribersCached } from '@/lib/actions/notificationActions';
import { getStatementId } from '@/lib/actions/statementActions';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string }>;
  children: React.ReactNode;
};

export default async function NewsletterLayout({ children, params }: Props) {
  const { statementSlug } = await params;
  const statementId = await getStatementId(statementSlug);
  const subscribers = await getSubscribersCached(statementId);
  const cookieStore = await cookies();
  const editModeCookie = cookieStore.get(`edit_${statementId}`);
  const editMode = editModeCookie ? JSON.parse(editModeCookie.value) : false;
  return (
    <EditModeProvider editModeEnabled={editMode}>
      <NewsletterProvider subscribers={subscribers}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </NewsletterProvider>
    </EditModeProvider>
  );
}
