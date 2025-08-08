import { redirect } from 'next/navigation';

import { getUser } from '@/lib/actions/baseActions';

type Props = {
  children: React.ReactNode;
  params: Promise<{ statementSlug: string; userSlug: string; version: string }>;
};

export default async function StatementEditLayout({ children, params }: Props) {
  const { statementSlug, userSlug } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/${userSlug}/${statementSlug}`);
  }

  return <div>{children}</div>;
}
