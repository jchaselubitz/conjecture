"use client";
import React from "react";
import { BaseStatementCitation } from "kysely-codegen";
import {
  BookIcon,
  CalendarIcon,
  FileTextIcon,
  LinkIcon,
  UsersIcon,
  QuoteIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/helpers/helpersDate";
import { cn } from "@/lib/utils";

interface FootnoteProps {
  order: number;
  citation: BaseStatementCitation;
  className?: string;
}

export function Footnote({ order, citation, className }: FootnoteProps) {
  // Generate MLA style citation text
  const generateMLACitation = () => {
    const parts = [];

    // Author names
    if (citation.authorNames) {
      parts.push(citation.authorNames + ".");
    }

    // Title (in quotes if it's an article, italicized if it's a book/publication)
    if (citation.title) {
      if (citation.titlePublication) {
        // It's an article, so use quotes
        parts.push(`"${citation.title}."`);
      } else {
        // It's a standalone work, so italicize (handled with CSS)
        parts.push(`<em>${citation.title}</em>.`);
      }
    }

    // Container title (publication title, italicized)
    if (citation.titlePublication) {
      parts.push(`<em>${citation.titlePublication}</em>,`);
    }

    // Volume and issue
    if (citation.volume) {
      parts.push(`vol. ${citation.volume},`);
    }

    if (citation.issue) {
      parts.push(`no. ${citation.issue},`);
    }

    // Publisher
    if (citation.publisher) {
      parts.push(`${citation.publisher},`);
    }

    // Year
    if (citation.year) {
      parts.push(`${formatDate({ date: new Date(citation.year) })},`);
    }

    // Pages
    if (citation.pageStart && citation.pageEnd) {
      parts.push(`pp. ${citation.pageStart}-${citation.pageEnd}.`);
    } else if (citation.pageStart) {
      parts.push(`p. ${citation.pageStart}.`);
    }

    return parts.join(" ");
  };

  // Format page range for detailed view
  const formatPageRange = () => {
    if (citation.pageStart && citation.pageEnd) {
      return `pp. ${citation.pageStart}-${citation.pageEnd}`;
    } else if (citation.pageStart) {
      return `p. ${citation.pageStart}`;
    }
    return null;
  };

  const formatVolume = () => {
    const parts = [];
    if (citation.volume) parts.push(`Vol. ${citation.volume}`);
    if (citation.issue) parts.push(`No. ${citation.issue}`);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div className={cn("flex gap-3 mt-4", className)}>
      <div className="citation-number shrink-0 mt-1">{order}</div>
      <Card className="w-full border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">MLA Citation</CardTitle>
          <CardDescription className="text-sm prose">
            <div dangerouslySetInnerHTML={{ __html: generateMLACitation() }} />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <div className="text-xs uppercase font-semibold text-muted-foreground mt-2">
            Citation Details
          </div>

          {citation.authorNames && (
            <div className="flex items-start gap-2">
              <UsersIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{citation.authorNames}</span>
            </div>
          )}

          {citation.title && (
            <div className="flex items-start gap-2">
              <QuoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{citation.title}</span>
            </div>
          )}

          {citation.titlePublication && (
            <div className="flex items-start gap-2">
              <BookIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm italic">
                {citation.titlePublication}
              </span>
            </div>
          )}

          {citation.year && (
            <div className="flex items-start gap-2">
              <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">
                {formatDate({ date: new Date(citation.year) })}
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
    </div>
  );
}
