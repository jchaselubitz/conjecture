"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { usePathname } from "next/navigation";
import { TextSelection } from "prosemirror-state";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  ButtonLoadingState,
  LoadingButton,
} from "@/components/ui/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import {
  createCitation,
  deleteCitation,
  updateCitation,
} from "@/lib/actions/citationActions";

const citationFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  authorNames: z.string().min(1, { message: "Author names are required" }),
  url: z.string().optional(),
  year: z.string().optional(),
  month: z.string().optional(),
  day: z.string().optional(),
  issue: z.string().optional(),
  volume: z.string().optional(),
  pageStart: z.string().optional(),
  pageEnd: z.string().optional(),
  publisher: z.string().optional(),
  titlePublication: z.string().optional(),
});

type CitationFormValues = z.infer<typeof citationFormSchema>;

interface CitationFormProps {
  statementId: string;
  creatorId: string;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function CitationForm({
  statementId,
  creatorId,
  onOpenChange,
  onClose,
}: CitationFormProps) {
  const { userId } = useUserContext();
  const { citationData, setCitationData, editor, updateStatementDraft } =
    useStatementContext();
  const pathname = usePathname();
  const [saveButtonState, setSaveButtonState] =
    useState<ButtonLoadingState>("default");
  const [error, setError] = useState<string | null>(null);

  // Extract date components if they exist
  const date = citationData.year ? new Date(citationData.year) : null;

  // Set default values based on citation data
  const defaultValues: CitationFormValues = {
    title: citationData.title || "",
    authorNames: citationData.authorNames || "",
    url: citationData.url || "",
    year: date ? date.getFullYear().toString() : "",
    month: date ? (date.getMonth() + 1).toString() : "none",
    day: date ? date.getDate().toString() : "none",
    issue: citationData.issue ? citationData.issue.toString() : "",
    volume: citationData.volume || "",
    pageStart: citationData.pageStart ? citationData.pageStart.toString() : "",
    pageEnd: citationData.pageEnd ? citationData.pageEnd.toString() : "",
    publisher: citationData.publisher || "",
    titlePublication: citationData.titlePublication || "",
  };

  const form = useForm<CitationFormValues>({
    resolver: zodResolver(citationFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const saveCitation = async () => {
    const id = nanoid();
    const formData = form.getValues();

    // Create date from form values if year is provided
    let dateValue = null;
    if (formData.year) {
      const year = parseInt(formData.year, 10);
      const month =
        formData.month && formData.month !== "none"
          ? parseInt(formData.month, 10) - 1
          : 0;
      const day =
        formData.day && formData.day !== "none"
          ? parseInt(formData.day, 10)
          : 1;
      dateValue = new Date(year, month, day);
    }

    await createCitation({
      creatorId,
      citation: {
        id,
        statementId,
        title: formData.title,
        authorNames: formData.authorNames,
        url: formData.url || null,
        year: dateValue,
        issue: formData.issue ? parseInt(formData.issue, 10) : null,
        pageEnd: formData.pageEnd ? parseInt(formData.pageEnd, 10) : null,
        pageStart: formData.pageStart ? parseInt(formData.pageStart, 10) : null,
        publisher: formData.publisher || null,
        titlePublication: formData.titlePublication || null,
        volume: formData.volume || null,
      },
      revalidationPath: {
        path: pathname,
        type: "page",
      },
    });
    return id;
  };

  const onSubmit = async (data: CitationFormValues) => {
    if (editor && userId && statementId) {
      const pos = editor.state.selection.$from.pos;
      try {
        setSaveButtonState("loading");
        if (citationData.id !== "") {
          // Create date from form values if year is provided
          let dateValue = null;
          if (data.year) {
            const year = parseInt(data.year, 10);
            const month =
              data.month && data.month !== "none"
                ? parseInt(data.month, 10) - 1
                : 0;
            const day =
              data.day && data.day !== "none" ? parseInt(data.day, 10) : 1;
            dateValue = new Date(year, month, day);
          }

          await updateCitation({
            creatorId,
            citation: {
              ...citationData,
              title: data.title,
              authorNames: data.authorNames,
              url: data.url || null,
              year: dateValue,
              issue: data.issue ? parseInt(data.issue, 10) : null,
              pageEnd: data.pageEnd ? parseInt(data.pageEnd, 10) : null,
              pageStart: data.pageStart ? parseInt(data.pageStart, 10) : null,
              publisher: data.publisher || null,
              titlePublication: data.titlePublication || null,
              volume: data.volume || null,
            },
            revalidationPath: {
              path: pathname,
              type: "page",
            },
          });
        } else {
          const id = await saveCitation();
          const tr = editor.state.tr;
          const node = editor.schema.nodes.citation.create({ citationId: id });
          tr.replaceSelectionWith(node);
          tr.setSelection(TextSelection.create(tr.doc, pos + 1));
          editor.view.dispatch(tr);
        }

        //Update draft instantly instead of waiting for debounce cause otherwise the citation will not consistently be updated in the draft
        setTimeout(() => {
          updateStatementDraft({
            statementId,
            content: editor.getHTML(),
            creatorId,
          });
          setSaveButtonState("default");
          onOpenChange(false);
          setCitationData({
            statementId,
            title: "",
            authorNames: "",
            id: "",
          });
          // Reset the form
          form.reset({
            title: "",
            authorNames: "",
            url: "",
            year: "",
            month: "none",
            day: "none",
            issue: "",
            volume: "",
            pageStart: "",
            pageEnd: "",
            publisher: "",
            titlePublication: "",
          });
        }, 0);
      } catch (error) {
        console.error("Failed to save citation:", error);
        setError("Failed to save citation");
        setSaveButtonState("default");
      }
    }
  };

  const handleDelete = async () => {
    if (citationData.id && editor && userId) {
      try {
        await deleteCitation(citationData.id, creatorId);
        editor.commands.deleteCitation({ citationId: citationData.id });
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to delete citation:", error);
        setError("Failed to delete citation");
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
                        min="1000"
                        max="9999"
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
                        <SelectItem value="none">Select Month</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>
                            {new Date(0, i).toLocaleString("default", {
                              month: "long",
                            })}
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
                        <SelectItem value="none">Select Day</SelectItem>
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
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onClose}
              >
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
