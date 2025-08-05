import { redirect } from 'next/navigation';

import { getUser } from '@/lib/actions/baseActions';

export default async function StatementLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ userSlug: string; statementSlug: string; version: string }>;
}) {
  const user = await getUser();
  const { userSlug, statementSlug, version } = await params;

  if (!user && version) {
    console.log('redirecting to /[userSlug]/[statementSlug]');
    redirect(`/${userSlug}/${statementSlug}`);
  }

  return <div>{children}</div>;
}
