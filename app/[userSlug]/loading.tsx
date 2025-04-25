'use client';

import { useSelectedLayoutSegment } from 'next/navigation';

import AppNav from '@/components/navigation/app_nav';
import { StatementListContainerLoading } from '@/containers/StatementListContainer';

export default function UserLoading() {
  const segment = useSelectedLayoutSegment();
  if (segment === null) {
    return (
      <div>
        <AppNav />
        <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
          <StatementListContainerLoading />
        </main>
      </div>
    );
  }
}
