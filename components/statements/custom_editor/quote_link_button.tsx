import { Editor } from '@tiptap/react';
import { Check, Quote } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuoteLinkButtonProps {
  editor: Editor;
  statementId: string;
}

export const QuoteLinkButton = ({ editor, statementId }: QuoteLinkButtonProps) => {
  const [copied, setCopied] = useState(false);
  const path = window.location.href;

  const generateQuoteLink = () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const location = `${from}-${to}`;
    const url = new URL(path);
    url.search = '';
    url.searchParams.set('statementId', statementId);
    url.searchParams.set('location', location ?? '');
    url.searchParams.set('content', selectedText ?? '');
    return url.href;
  };

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateQuoteLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      setCopied(false);
    }
  }, [generateQuoteLink]);

  return (
    <Button variant="ghost" size="sm" onClick={copy} className={cn('gap-2')}>
      {copied ? <Check className="h-4 w-4" /> : <Quote className="h-4 w-4" />}
      <span className="">Quote Link</span>
    </Button>
  );
};
