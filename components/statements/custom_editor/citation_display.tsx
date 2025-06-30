import { BaseStatementCitation, StatementWithUser } from 'kysely-codegen';
import { BookIcon, CalendarIcon, FileTextIcon, LinkIcon, UsersIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';
import { getPublishedStatement } from '@/lib/actions/statementActions';
import { formatDateForCitation } from '@/lib/helpers/helpersDate';
import { cn } from '@/lib/utils';
export function CitationDisplay() {
  const { citationData } = useStatementToolsContext();
  const citation = citationData as BaseStatementCitation;
  const [conjecture, setConjecture] = useState<StatementWithUser | null>(null);

  const formatPageRange = () => {
    const { pageType } = citation;
    const pageTypeText = pageType === 'location' ? 'loc.' : 'pp.';
    if (citation.pageStart && citation.pageEnd) {
      return `${pageTypeText} ${citation.pageStart}-${citation.pageEnd}`;
    } else if (citation.pageStart) {
      return `${pageTypeText} ${citation.pageStart}`;
    }
    return null;
  };

  const formatVolume = () => {
    const parts = [];
    if (citation.volume) parts.push(`Vol. ${citation.volume}`);
    if (citation.issue) parts.push(`No. ${citation.issue}`);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const [_, fetch] = useAsyncFn(async () => {
    if (citation.url) {
      const url = new URL(citation.url);
      if (url.origin === window.location.origin) {
        const statementSlug = url.searchParams.get('statementSlug');
        if (!statementSlug) return;
        try {
          const statement = await getPublishedStatement(statementSlug);
          if (statement) {
            setConjecture(statement);
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
    return null;
  });

  useEffect(() => {
    fetch();
  }, [citation.url, fetch]);

  return (
    <Card
      className={cn(
        'w-full border-none overflow-hidden shadow-none pt-0',
        !conjecture?.headerImg && 'pt-4'
      )}
    >
      {conjecture?.headerImg && (
        <AspectRatio ratio={16 / 6} className="bg-muted rounded-md ">
          <Image
            src={conjecture.headerImg}
            alt={conjecture.title || 'Statement header image'}
            fill
            className="object-cover"
            priority={false}
          />
        </AspectRatio>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">{citation.title}</CardTitle>
        {citation.titlePublication && (
          <CardDescription className="text-sm italic">{citation.titlePublication}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pb-2">
        {citation.authorNames && (
          <div className="flex items-start gap-2">
            <UsersIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm">{citation.authorNames}</span>
          </div>
        )}

        {citation.year && (
          <div className="flex items-start gap-2">
            <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm">
              {formatDateForCitation({
                year: citation.year,
                month: citation.month,
                day: citation.day
              })}
            </span>
          </div>
        )}

        {citation.publisher && (
          <div className="flex items-start gap-2">
            <BookIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm">{citation.publisher}</span>
          </div>
        )}

        {formatVolume() && (
          <div className="flex items-start gap-2">
            <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm">{formatVolume()}</span>
          </div>
        )}

        {formatPageRange() && (
          <div className="flex items-start gap-2">
            <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm">{formatPageRange()}</span>
          </div>
        )}

        {citation.url && (
          <div className="flex items-start gap-2">
            <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate"
            >
              {citation.url}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
