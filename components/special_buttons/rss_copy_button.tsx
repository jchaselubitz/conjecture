'use client';

import { Check, Rss } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/button';

interface RssCopyButtonProps {
  rssUrl: string;
  className?: string;
}

export default function RssCopyButton({ rssUrl, className }: RssCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyRssUrl = async () => {
    try {
      await navigator.clipboard.writeText(rssUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy RSS URL:', err);
    }
  };

  return (
    <Button
      onClick={handleCopyRssUrl}
      variant="outline"
      size="sm"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Rss className="h-4 w-4" />
          RSS
        </>
      )}
    </Button>
  );
}
