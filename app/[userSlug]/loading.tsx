'use client';

import { useSelectedLayoutSegment } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';

export default function UserLoading() {
  const segment = useSelectedLayoutSegment();

  if (segment) return null;

  return (
    <div>
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        <div className="flex items-center justify-between pb-8 ">
          <h1 className="text-3xl font-bold">Statements</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(statement => (
            <Skeleton className="animate-pulse h-48 bg-gray-200 rounded-lg" key={statement} />
          ))}
        </div>
      </main>
    </div>
  );
}
