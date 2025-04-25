import AppNav from '@/components/navigation/app_nav';
import { StatementContainerLoading } from '@/containers/StatementContainer';

export default async function StatementLoading() {
  return (
    <div>
      <AppNav />
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        <StatementContainerLoading />
      </main>
    </div>
  );
}
