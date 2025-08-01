import SiteNav from '@/components/navigation/site_nav';

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}
