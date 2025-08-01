'use client';
import { SubscriptionWithRecipient } from 'kysely-codegen';
import { createContext, ReactNode, useContext } from 'react';

interface NewsletterContextType {
  subscribers: SubscriptionWithRecipient[];
}

const NewsletterContext = createContext<NewsletterContextType | undefined>(undefined);

export function NewsletterProvider({
  children,
  subscribers
}: {
  children: ReactNode;
  subscribers: SubscriptionWithRecipient[];
}) {
  return (
    <NewsletterContext.Provider value={{ subscribers }}>{children}</NewsletterContext.Provider>
  );
}

export function useNewsletterContext() {
  const context = useContext(NewsletterContext);
  if (context === undefined) {
    throw new Error('useNewsletterContext must be used within a NewsletterProvider');
  }
  return context;
}
