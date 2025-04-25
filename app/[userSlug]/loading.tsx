import AppNav from '@/components/navigation/app_nav';
import { StatementListContainerLoading } from '@/containers/StatementListContainer';

type UserPageProps = {
  params: Promise<{
    userSlug: string;
  }>;
};

export default async function UserLoading({ params }: UserPageProps) {
  return (
    <div>
      <AppNav />
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        <StatementListContainerLoading />
      </main>
    </div>
  );
}
