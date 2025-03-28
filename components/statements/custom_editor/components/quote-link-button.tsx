import { Editor } from "@tiptap/react";
import { Link2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuoteLinkButtonProps {
  editor: Editor;
}

export const QuoteLinkButton = ({ editor }: QuoteLinkButtonProps) => {
  const handleCopyQuoteLink = () => {
    const { from, to } = editor.state.selection;
    if (from === to) return;

    // Get the selected text content
    const selectedText = editor.state.doc.textBetween(from, to);

    // Get the base URL without any parameters
    const url = new URL(window.location.href);
    url.search = ""; // Clear all existing parameters

    // Add both location and content parameters
    url.searchParams.set("location", `${from}-${to}`);
    url.searchParams.set("content", selectedText);

    // Copy to clipboard
    navigator.clipboard
      .writeText(url.toString())
      .then(() => {
        toast.success("Link copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopyQuoteLink}
      className={cn("gap-2")}
    >
      <Quote className="h-4 w-4" />
      <span className="hidden sm:inline">Quote Link</span>
    </Button>
  );
};
