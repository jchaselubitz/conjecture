'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useUserContext } from '@/contexts/userContext';
import { createStatement, updateStatementThreadId } from '@/lib/actions/statementActions';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { ButtonLoadingState, LoadingButton } from '../ui/loading-button';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface RebuttalButtonProps {
  existingStatementId: string;
  existingTitle: string;
  existingThreadId: string | null;
  className?: string;
  buttonText?: React.ReactNode | string;
}

export default function RebuttalButton({
  existingStatementId,
  existingTitle,
  existingThreadId,
  className,
  buttonText = 'Respond'
}: RebuttalButtonProps) {
  const [open, setOpen] = useState(false);
  const [buttonState, setButtonState] = useState<ButtonLoadingState>('default');
  const { userId, currentUserSlug } = useUserContext();

  const threadId = existingThreadId ?? nanoid();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subtitle: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    if (!userId || !currentUserSlug) {
      alert('User not found');
      return;
    }

    try {
      setButtonState('loading');
      if (!existingThreadId) {
        await updateStatementThreadId({
          statementId: existingStatementId,
          threadId
        });
      }
      await createStatement({
        creatorSlug: currentUserSlug,
        creatorId: userId,
        title: data.title,
        subtitle: data.subtitle,
        parentId: existingStatementId,
        threadId
      });
      setButtonState('success');
      // Dialog will close automatically due to navigation in createDraft
    } catch (error) {
      console.error('Error creating response:', error);
      setButtonState('error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs md:max-w-md top-20 md:top-[50%] translate-y-[-10%] md:translate-y-[-50%] ">
        <DialogHeader>
          <DialogTitle>Respond to {existingTitle}</DialogTitle>
          <DialogDescription>Write a linked critique.</DialogDescription>
        </DialogHeader>
        {userId ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title for your response" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a subtitle (optional)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-2">
                <LoadingButton
                  type="submit"
                  buttonState={buttonState}
                  text="Begin writing your response"
                  loadingText="Creating..."
                  successText="Created!"
                  errorText="Failed to create"
                  setButtonState={setButtonState}
                />
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="default" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="outline" size="sm">
                Create Account
              </Button>
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
