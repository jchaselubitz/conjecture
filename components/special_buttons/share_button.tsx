import { Check, Facebook, Link, Linkedin, Send, Share2, Twitter } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';

interface ShareButtonProps {
  updatedStatement: any;
}

export const ShareButton = ({ updatedStatement }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${updatedStatement.creatorSlug}/${updatedStatement.slug}`
      : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(updatedStatement.title || 'Check out this conjecture');
    const body = encodeURIComponent(
      `I thought you might be interested in this conjecture:\n\n${shareUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSocialShare = (platform: 'facebook' | 'linkedin' | 'twitter') => {
    const text = encodeURIComponent(updatedStatement.title || 'Check out this conjecture');
    const url = encodeURIComponent(shareUrl);

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 px-2">
          <Share2 className="h-4 w-4 mr-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Link className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy link'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmailShare}>
          <Send className="mr-2 h-4 w-4" />
          Send as message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSocialShare('facebook')}>
          <Facebook className="mr-2 h-4 w-4" />
          Share to Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialShare('linkedin')}>
          <Linkedin className="mr-2 h-4 w-4" />
          Share to LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialShare('twitter')}>
          <Twitter className="mr-2 h-4 w-4" />
          Share to X
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
