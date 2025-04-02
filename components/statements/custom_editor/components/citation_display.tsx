import { BaseStatementCitation } from "kysely-codegen";
import {
  BookIcon,
  CalendarIcon,
  FileTextIcon,
  LinkIcon,
  UsersIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStatementContext } from "@/contexts/statementContext";

export function CitationDisplay() {
  const { citationData } = useStatementContext();
  const citation = citationData as BaseStatementCitation;

  // Helper function to handle optional fields
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
    <Card className="w-full border-none shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">{citation.title}</CardTitle>
        {citation.titlePublication && (
          <CardDescription className="text-sm italic">
            {citation.titlePublication}
          </CardDescription>
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
            <span className="text-sm">{String(citation.year)}</span>
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
