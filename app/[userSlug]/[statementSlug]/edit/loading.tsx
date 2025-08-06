'use client';

import { useSelectedLayoutSegment } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';

export default function StatementLoading() {
  const segment = useSelectedLayoutSegment();

  if (segment) return null;

  return (
    <div>
      <div className=" py-8 px-4 md:px-0 w-full">
        <div className="mx-auto flex flex-col  md:max-w-3xl">
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
      </div>
    </div>
  );
}
