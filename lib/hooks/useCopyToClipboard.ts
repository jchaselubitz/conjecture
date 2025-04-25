import { useCallback, useState } from 'react';

interface CopyToClipboardReturn {
  copied: boolean;
  copy: () => Promise<void>;
}

export function useCopyToClipboard(text: string): CopyToClipboardReturn {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      setCopied(false);
    }
  }, [text]);

  return { copied, copy };
}
