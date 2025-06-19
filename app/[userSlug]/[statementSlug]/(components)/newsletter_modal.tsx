'use client';

import { StatementWithUser } from 'kysely-codegen';
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Newsletter from './newsletter';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';

interface NewsletterModalProps {
  statement: StatementWithUser;
  children?: React.ReactNode;
}

export default function NewsletterModal({ statement, children }: NewsletterModalProps) {
  const { newsletterModalOpen, setNewsletterModalOpen } = useStatementToolsContext();

  return (
    <Dialog open={newsletterModalOpen} onOpenChange={setNewsletterModalOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            Preview Newsletter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Newsletter Preview</DialogTitle>
        <Newsletter statement={statement} />
      </DialogContent>
    </Dialog>
  );
}
