import SiteNav from '@/components/navigation/site_nav';

export default function ManageSubscriptionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}
