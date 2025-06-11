'use client';

import { useSelectedLayoutSegment } from 'next/navigation';

import AppNav from '@/components/navigation/app_nav';
import { Skeleton } from '@/components/ui/skeleton';
import { StatementCardLoading } from '@/components/statements/card/statement_card';

export default function UserLoading() {
  const segment = useSelectedLayoutSegment();

  return (
    <div>
      <AppNav />
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        {segment === null ? (
          <>
            <div className="flex items-center justify-between pb-8 ">
              <h1 className="text-3xl font-bold">Statements</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(statement => (
                // <StatementCardLoading key={statement} />
                <Skeleton className="animate-pulse h-48 bg-gray-200 rounded-lg" key={statement} />
              ))}
            </div>
          </>
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
