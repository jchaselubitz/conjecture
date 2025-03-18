import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "./status_badge";
import { DraftWithUser } from "kysely-codegen";
import Byline from "@/app/(app)/statements/(components)/byline";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface StatementCardProps {
  statement: DraftWithUser;
  isPublic?: boolean;
}

export function StatementCard({ statement, isPublic }: StatementCardProps) {
  // Format dates
  const formattedDate = statement.publishedAt
    ? format(new Date(statement.publishedAt), "MMM d, yyyy")
    : format(new Date(statement.updatedAt), "MMM d, yyyy");

  // Extract a preview from content (first ~100 characters)
  const previewLength = isPublic ? 200 : 100;
  const contentPreview = statement.content
    ? statement.content.replace(/<[^>]*>?/gm, "").slice(0, previewLength) +
      (statement.content.length > previewLength ? "..." : "")
    : statement.subtitle || "No preview available";

  return (
    <Link
      href={`/statements/${statement.statementId}`}
      className="block transition-transform hover:scale-[1.01]"
    >
      <Card className="h-full overflow-hidden pt-0">
        {statement.headerImg && (
          <AspectRatio ratio={16 / 8} className="bg-muted rounded-md ">
            <Image
              src={statement.headerImg}
              alt={statement.title || "Statement header image"}
              fill
              className="object-cover"
              priority={false}
            />
          </AspectRatio>
        )}
        <CardHeader>
          <div className="flex items-center gap-2">
            <StatusBadge isPublished={statement.publishedAt !== null} />
            <CardDescription className="text-sm text-muted-foreground">
              {formattedDate}
            </CardDescription>
          </div>
          <CardTitle className="mt-2 text-xl">
            {statement.title || "Untitled Statement"}
          </CardTitle>
          {statement.subtitle && (
            <CardDescription className="text-base">
              {statement.subtitle}
            </CardDescription>
          )}
          {isPublic && (
            <div className="flex items-center mt-2">
              <Byline statement={statement} />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{contentPreview}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {statement.publishedAt
              ? `Published on ${formattedDate}`
              : `Last updated on ${formattedDate}`}
          </div>
          <div className="text-sm font-medium">v{statement.versionNumber}</div>
        </CardFooter>
      </Card>
    </Link>
  );
}
