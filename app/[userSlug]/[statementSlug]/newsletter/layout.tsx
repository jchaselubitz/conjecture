import { Suspense } from 'react';

type Props = {
  children: React.ReactNode;
};

export default function NewsletterLayout({ children }: Props) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}
