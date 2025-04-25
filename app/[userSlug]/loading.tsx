'use client';

import { useSelectedLayoutSegment } from 'next/navigation';

import AppNav from '@/components/navigation/app_nav';
import { Skeleton } from '@/components/ui/skeleton';
import { StatementListContainerLoading } from '@/containers/StatementListContainer';
export default function UserLoading() {
  const segment = useSelectedLayoutSegment();

  return (
    <div>
      <AppNav />
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        {segment === null ? (
          <StatementListContainerLoading />
        ) : (
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
        )}
      </main>
    </div>
  );
}
