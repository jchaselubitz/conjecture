import { DraftWithUser } from 'kysely-codegen';
import Link from 'next/link';
import React from 'react';

import { cn } from '@/lib/utils';

export interface StackCardProps {
  title: string;
  author: string;
  publishedAt: Date | null;
  zIndex?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
  tabIndex?: number;
  onClick?: () => void;
  creatorSlug?: string;
  slug?: string;
}

const StackCard: React.FC<StackCardProps> = ({
  title,
  author,
  publishedAt,
  zIndex,
  opacity,
  className,
  style,
  tabIndex = 0,
  onClick,
  creatorSlug,
  slug
}) => {
  // Format the date if provided
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <Link href={`/${creatorSlug}/${slug}`} className="w-full">
      <button
        className={cn(
          'flex flex-col bg-white/90 shadow-md rounded-md px-3 py-2 text-left border border-zinc-200 hover:bg-zinc-100 transition-all cursor-pointer w-full overflow-hidden relative',
          className
        )}
        style={{ zIndex, opacity, ...style }}
        tabIndex={tabIndex}
        onClick={onClick}
      >
        <div className="font-semibold truncate">{title}</div>
        <div className="flex items-center gap-1">
          <div className="text-xs text-zinc-500 truncate">by {author}</div>
          {formattedDate && <div className="text-xs text-zinc-400 truncate">{formattedDate}</div>}
        </div>
      </button>
    </Link>
  );
};

export default StackCard;
