import { format } from 'date-fns';
import { StatementWithUser } from 'kysely-codegen';
import Image from 'next/image';
import Link from 'next/link';

import Byline from '@/components/statements/byline';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import { StatusBadge } from './status_badge';

interface StatementCardProps {
  statement: StatementWithUser;
  isPublic?: boolean;
  pathname: string;
}

export function StatementCard({ statement, isPublic, pathname }: StatementCardProps) {
  const formattedDate = statement.draft.publishedAt
    ? format(new Date(statement.draft.publishedAt), 'MMM d, yyyy')
    : format(new Date(statement.updatedAt), 'MMM d, yyyy');

  const previewLength = isPublic ? 200 : 100;
  const contentPreview = statement.draft.content
    ? statement.draft.content.replace(/<[^>]*>?/gm, '').slice(0, previewLength) +
      (statement.draft.content.length > previewLength ? '...' : '')
    : statement.subtitle || 'No preview available';

  // const annotationCount = statement.draft.annotations?.length || 0;

  return (
    <Link
      href={`/${pathname}/${statement.slug}/${statement.draft.versionNumber}`}
      className="block transition-transform hover:scale-[1.01]"
    >
      <Card className="relative h-full overflow-hidden pt-0 ">
        <AspectRatio ratio={16 / 8} className="bg-muted rounded-md ">
          {statement.headerImg ? (
            <Image
              src={statement.headerImg}
              alt={statement.title || 'Statement header image'}
              fill
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="rounded-b-md h-4" />
          )}
        </AspectRatio>

        <CardHeader>
          <CardTitle className="mt-2 text-xl">{statement.title || 'Untitled Statement'}</CardTitle>
          {statement.subtitle && (
            <CardDescription className="text-base">{statement.subtitle}</CardDescription>
          )}
          {isPublic && (
            <div className="flex items-center mt-2">
              <Byline statement={statement} />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-8">{contentPreview}</p>
        </CardContent>
        <CardFooter className="absolute bottom-0 left-0 right-0 flex justify-between py-3">
          <div className="flex items-center gap-2">
            <StatusBadge isPublished={statement.draft.publishedAt !== null} />
            <CardDescription className="text-sm text-muted-foreground">
              {formattedDate}
            </CardDescription>
          </div>
          {/* <div className="text-sm font-medium">{annotationCount}</div> */}
        </CardFooter>
      </Card>
    </Link>
  );
}
