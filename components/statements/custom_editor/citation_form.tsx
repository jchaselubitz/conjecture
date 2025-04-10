'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Editor } from '@tiptap/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useStatementContext } from '@/contexts/statementContext';
import { useUserContext } from '@/contexts/userContext';
import { deleteCitation } from '@/lib/actions/citationActions';
import { MonthsArray } from '@/lib/lists';

import {
  citationDateCreator,
  upsertCitation
} from './custom_extensions/helpers/helpersCitationExtension';
const citationFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  authorNames: z.string().optional(),
  url: z.string().optional(),
  date: z.date().optional(),
  year: z.string().optional(),
  month: z.string().optional(),
  day: z.string().optional(),
  issue: z.string().optional(),
  volume: z.string().optional(),
  pageStart: z.string().optional(),
  pageEnd: z.string().optional(),
  publisher: z.string().optional(),
  titlePublication: z.string().optional()
});

type CitationFormValues = z.infer<typeof citationFormSchema>;

interface CitationFormProps {
  statementId: string;
  creatorId: string;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  editor?: Editor | null;
}

export function CitationForm({
  statementId,
  creatorId,
  onOpenChange,
  onClose,
  editor
}: CitationFormProps) {
  const { userId } = useUserContext();
  const { citationData, setCitationData, updateStatementDraft } = useStatementContext();
  const pathname = usePathname();
  const [saveButtonState, setSaveButtonState] = useState<ButtonLoadingState>('default');
  const [error, setError] = useState<string | null>(null);

  const defaultValues: CitationFormValues = {
    title: citationData.title || '',
    authorNames: citationData.authorNames || '',
    url: citationData.url || '',
    year: citationData.year ? citationData.year.toString() : '',
    month: citationData.month ? citationData.month.toString() : 'none',
    day: citationData.day ? citationData.day.toString() : 'none',
    issue: citationData.issue ? citationData.issue.toString() : '',
    volume: citationData.volume || '',
    pageStart: citationData.pageStart ? citationData.pageStart.toString() : '',
    pageEnd: citationData.pageEnd ? citationData.pageEnd.toString() : '',
    publisher: citationData.publisher || '',
    titlePublication: citationData.titlePublication || ''
  };

  const form = useForm<CitationFormValues>({
    resolver: zodResolver(citationFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  const onSubmit = async (data: CitationFormValues) => {
    if (editor && userId && statementId) {
      const {
        month,
        day,
        year,
        url,
        authorNames,
        title,
        issue,
        pageEnd,
        pageStart,
        publisher,
        titlePublication,
        volume
      } = data;

      const dateValue = citationDateCreator({
        year: data.year ? parseInt(data.year, 10) : null,
        month: data.month && data.month !== 'none' ? parseInt(data.month, 10) : null,
        day: data.day && data.day !== 'none' ? parseInt(data.day, 10) : null
      });

      const newCitationData = {
        ...citationData,
        title: title,
        authorNames: authorNames,
        url: url || null,
        date: dateValue,
        year: year ? parseInt(year, 10) : null,
        month: month && month !== 'none' ? parseInt(month, 10) : null,
        day: day && day !== 'none' ? parseInt(day, 10) : null,
        issue: issue ? parseInt(issue, 10) : null,
        pageEnd: pageEnd ? parseInt(pageEnd, 10) : null,
        pageStart: pageStart ? parseInt(pageStart, 10) : null,
        publisher: publisher || null,
        titlePublication: titlePublication || null,
        volume: volume || null
      };
      setSaveButtonState('loading');
      const updateDraft = async () => {
        await updateStatementDraft({ content: editor.getHTML() });
      };
      await upsertCitation({
        citationData: newCitationData,
        setError,
        creatorId,
        statementId,
        pathname,
        position: editor.state.selection.$from.pos + 1,
        view: editor.view
      });
      // setTimeout(() => {
      await updateDraft();
      // }, 0);
      onOpenChange(false);
      setCitationData({
        statementId,
        title: '',
        authorNames: '',
        id: ''
      });
      setSaveButtonState('default');
    }
  };

  const handleDelete = async () => {
    if (citationData.id && editor && userId) {
      try {
        await deleteCitation(citationData.id, creatorId);
        editor.commands.deleteCitation({ citationId: citationData.id });
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to delete citation:', error);
        setError('Failed to delete citation');
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="authorNames"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author Names</FormLabel>
                <FormControl>
                  <Input placeholder="Author Names" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Publication Date</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Year"
                        max={new Date().getFullYear()}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>

                        {MonthsArray.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>

                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="volume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume</FormLabel>
                  <FormControl>
                    <Input placeholder="Volume" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pageStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Page</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="From page" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pageEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Page</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="To page" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="publisher"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publisher</FormLabel>
                <FormControl>
                  <Input placeholder="Publisher" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="titlePublication"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publication Title</FormLabel>
                <FormControl>
                  <Input placeholder="Publication Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="flex justify-between gap-2 mt-4">
            <Button
              variant="destructive"
              size="sm"
              type="button"
              onClick={handleDelete}
              disabled={!citationData.id}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <LoadingButton
                size="sm"
                type="submit"
                buttonState={saveButtonState}
                text="Save"
                loadingText="Saving..."
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
