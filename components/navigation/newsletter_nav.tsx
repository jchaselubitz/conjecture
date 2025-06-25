'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { LoadingButton } from '@/components/ui/loading-button';
import { useEditModeContext } from '@/contexts/EditModeContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';
import { sendNewsletterEmail } from '@/lib/actions/notificationActions';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function NewsletterNav() {
  const { currentUserSlug } = useUserContext();
  const { editMode } = useEditModeContext();
  const { updatedStatement, currentVersion } = useStatementContext();

  const [sendEmailState, setSendEmailState] = useState<'default' | 'loading' | 'success' | 'error'>(
    'default'
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testEmails, setTestEmails] = useState<string[]>(['', '', '']);

  const router = useRouter();

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...testEmails];
    newEmails[index] = value;
    setTestEmails(newEmails);
  };

  const handleSendEmail = async () => {
    setSendEmailState('loading');
    try {
      const validEmails = testEmails.filter(email => email.trim() !== '');
      await sendNewsletterEmail({
        statement: updatedStatement,
        authorNames: updatedStatement.authors.map(author => author.name || author.username || ''),
        testEmails: [...validEmails, 'delivered@resend.dev']
      });
      setSendEmailState('success');
      setTimeout(() => {
        setDialogOpen(false);
        setSendEmailState('default');
        setTestEmails(['', '', '']);
      }, 2000);
    } catch (error) {
      console.error('Error sending email:', error);
      setSendEmailState('error');
    }
  };

  return (
    <header className="h-14">
      <div className="fixed z-50 top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(
                `/${currentUserSlug}/${updatedStatement?.slug}/${currentVersion}&edit=${editMode}`
              )
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-4">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Send a test email</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Send Test Newsletter</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="text-sm text-muted-foreground">
                      Enter up to 3 email addresses to send a test newsletter:
                    </div>
                    {testEmails.map((email, index) => (
                      <div key={index} className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`email-${index}`} className="text-right">
                          Email {index + 1}
                        </Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={e => handleEmailChange(index, e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <LoadingButton
                      buttonState={sendEmailState}
                      onClick={handleSendEmail}
                      variant="default"
                      text="Send Test Email"
                      loadingText="Sending..."
                      successText="Email Sent!"
                      errorText="Failed to send"
                      disabled={testEmails.every(email => email.trim() === '')}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
