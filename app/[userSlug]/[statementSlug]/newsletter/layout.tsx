import { cookies } from 'next/headers';
import { Suspense } from 'react';

import { EditModeProvider } from '@/contexts/EditModeContext';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string }>;
  children: React.ReactNode;
};

export default async function NewsletterLayout({ children, params }: Props) {
  const { statementSlug } = await params;

  const cookieStore = await cookies();
  const editModeCookie = cookieStore.get(`edit_${statementSlug}`);
  const editMode = editModeCookie ? JSON.parse(editModeCookie.value) : false;
  return (
    // <EditModeProvider editModeEnabled={editMode}>
    <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    // </EditModeProvider>
  );
}
