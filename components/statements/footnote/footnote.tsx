"use client";
import { BaseStatementCitation } from "kysely-codegen";
import { CheckIcon, CopyIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { formatDateForCitation } from "@/lib/helpers/helpersDate";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

interface FootnoteProps {
  order: number;
  anchorId: string;
  citation: BaseStatementCitation;
  className?: string;
}

export function Footnote({
  order,
  citation,
  className,
  anchorId,
}: FootnoteProps) {
  // Generate MLA style citation text
  const generateMLACitation = () => {
    const parts = [];
    // Author names
    if (citation.authorNames) {
      parts.push(citation.authorNames + ".");
    }

    // Title (in quotes if it's an article, italicized if it's a book/publication)
    if (citation.title) {
      // if the article in a publication, use quotes for title

      const title = citation.titlePublication
        ? `"${citation.title}."`
        : `<em>${citation.title}</em>.`;

      if (citation.url) {
        parts.push(
          `<a href="${citation.url}" target="_blank" class="text-primary hover:underline">${title}</a>`,
        );
      } else {
        parts.push(title);
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
    // date
    if (citation.year) {
      parts.push(
        formatDateForCitation({
          year: citation.year,
          month: citation.month,
          day: citation.day,
        }),
      );
    }
    // Pages
    if (citation.pageStart && citation.pageEnd) {
      parts.push(`pp. ${citation.pageStart}-${citation.pageEnd}.`);
    } else if (citation.pageStart) {
      parts.push(`p. ${citation.pageStart}.`);
    }

    return parts.join(" ");
  };

  const { copy, copied } = useCopyToClipboard(
    generateMLACitation().replace(/<[^>]+>/g, ""),
  );

  return (
    <div className={cn("flex gap-3 mt-4", className)}>
      <a href={`#${anchorId}`} className="citation-number shrink-0 mt-1">
        {order}
      </a>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div
            dangerouslySetInnerHTML={{
              __html: generateMLACitation() as unknown as TrustedHTML,
            }}
          />
          <Button variant="ghost" size="sm" onClick={copy} className="h-8 px-2">
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
