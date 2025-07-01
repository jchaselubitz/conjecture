import AppNav from '@/components/navigation/app_nav';
import NotFound from '@/components/ui/not_found';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <NotFound
        title="404"
        message={
          <>
            Sorry, the page you are looking for doesn't exist or has been moved.
            <br />
            Explore more conjectures or return to the feed.
          </>
        }
        actions={[
          { label: 'Go to Feed', href: '/feed', variant: 'default' },
          { label: 'Home', href: '/', variant: 'outline' }
        ]}
      />
    </div>
  );
}
