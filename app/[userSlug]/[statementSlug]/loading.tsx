'use client';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatementLoading() {
  return (
    <div>
      <div className="flex justify-center py-8 px-4 md:px-0">
        <div className="flex flex-col h-full max-w-screen md:max-w-3xl">
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
