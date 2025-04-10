import { Editor } from '@tiptap/react';
import { Check, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { cn } from '@/lib/utils';

interface QuoteLinkButtonProps {
  editor: Editor;
  statementId: string;
}

export const QuoteLinkButton = ({ editor, statementId }: QuoteLinkButtonProps) => {
  const generateQuoteLink = () => {
    const { from, to } = editor.state.selection;
    if (from === to) return;

    // Get the selected text content
    const selectedText = editor.state.doc.textBetween(from, to);

    // Get the base URL without any parameters
    const url = new URL(window.location.href);
    url.search = ''; // Clear all existing parameters

    // Add both location and content parameters
    url.searchParams.set('statementId', statementId);
    url.searchParams.set('location', `${from}-${to}`);
    url.searchParams.set('content', selectedText);

    return url.toString();
  };

  const { copy, copied } = useCopyToClipboard(generateQuoteLink() ?? '');

  return (
    <Button variant="ghost" size="sm" onClick={copy} className={cn('gap-2')}>
      {copied ? <Check className="h-4 w-4" /> : <Quote className="h-4 w-4" />}
      <span className="">Quote Link</span>
    </Button>
  );
};
