import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { Button } from './button';

interface NotFoundAction {
  label: string;
  href: string;
  variant?: 'default' | 'outline';
}

interface NotFoundProps {
  title: string;
  message: React.ReactNode;
  actions?: NotFoundAction[];
}

export default function NotFound({ title, message, actions }: NotFoundProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4 py-24">
        <div className="relative mb-8">
          <Image
            src="/conject-logo.png"
            alt="Conject Logo"
            width={80}
            height={80}
            className="mx-auto mb-4 opacity-80"
            priority
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#2D1810]">{title}</h1>
        <div className="mb-8 text-lg text-muted-foreground max-w-md mx-auto">{message}</div>
        {actions && actions.length > 0 && (
          <div className="flex gap-4 justify-center">
            {actions.map((action, idx) => (
              <Link href={action.href} key={idx}>
                <Button variant={action.variant || 'default'} size="lg">
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
