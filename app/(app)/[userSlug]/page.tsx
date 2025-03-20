import { Metadata } from "next";
import AppNav from "@/components/navigation/app_nav";
import { StatementListContainer } from "@/containers/StatementListContainer";
import { getDrafts } from "@/lib/actions/statementActions";
import { getUserProfile } from "@/lib/actions/userActions";

type UserPageProps = {
  params: Promise<{
    userSlug: string;
  }>;
};

export const metadata: Metadata = {
  title: "User Profile",
};

export default async function UserPage({ params }: UserPageProps) {
  const { userSlug } = await params;

  const profile = await getUserProfile(userSlug);

  if (!profile) {
    return <div>User not found</div>;
  }
  const statements = await getDrafts({ creatorId: profile.id });

  const { name, username, imageUrl } = profile;

  return (
    <div>
      <AppNav />
      <main className="flex-1 mx-auto bg-background container py-8">
        <StatementListContainer
          statements={statements}
          title={`${name}'s Statements`}
          pathname={`${userSlug}`}
        />
      </main>
    </div>
  );
}
