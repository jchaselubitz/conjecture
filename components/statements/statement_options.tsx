import { DraftWithAnnotations } from 'kysely-codegen';
import {
  BarChart3,
  Check,
  Facebook,
  Link,
  Linkedin,
  MoreHorizontal,
  PencilLine,
  Send,
  Share2,
  Trash2,
  Twitter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';
import { deleteStatement, updateStatementUrl } from '@/lib/actions/statementActions';
import { checkValidStatementSlug } from '@/lib/helpers/helpersStatements';
import { cn } from '@/lib/utils';

import { ShareButton } from '../special_buttons/share_button';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { ButtonLoadingState } from '../ui/loading-button';
import { Separator } from '../ui/separator';
import ViewModeButton from '../view_mode_button';
import { CommentIndicatorButton } from './comments_menu';
import RebuttalButton from './rebuttal_button';
import VoteButton from './vote_button';
interface StatementOptionsProps {
  statement: DraftWithAnnotations;
  editMode: boolean;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  handleEditModeToggle: () => void;
  onShowAuthorCommentsChange: (checked: boolean) => void;
  onShowReaderCommentsChange: (checked: boolean) => void;
  className?: string;
}

export default function StatementOptions({
  statement,
  editMode,
  showAuthorComments,
  showReaderComments,
  handleEditModeToggle,
  onShowAuthorCommentsChange,
  onShowReaderCommentsChange,
  className
}: StatementOptionsProps) {
  const { userId } = useUserContext();
  const router = useRouter();
  const [buttonState, setButtonState] = useState<ButtonLoadingState>('default');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>(statement.slug || '');
  const handleDelete = async () => {
    try {
      await deleteStatement(statement.statementId, statement.creatorId, statement.headerImg || '');
      router.push('/statements');
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateSlug = async (slug: string) => {
    if (!checkValidStatementSlug(slug) || slug === '') {
      setSlugError('That URL is not valid');
      return;
    }
    if (slug === statement.slug) {
      return;
    }
    if (slug.length < 5) {
      setSlugError(`The post's domain must be at least 5 characters long`);
      return;
    }
    if (
      !confirm(
        'Are you sure you want to update the URL? This may break existing links to this post.'
      )
    ) {
      return;
    }

    try {
      setButtonState('loading');
      await updateStatementUrl({
        statementId: statement.statementId,
        slug,
        creatorId: statement.creatorId
      });
      setButtonState('success');
      setSlugError(null);
      router.push(`/${statement.creatorSlug}/${slug}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('URL already exists')) {
        setSlugError('That URL is already taken');
      } else {
        console.error(error);
      }
      setButtonState('error');
    }
  };

  return (
    <div className={cn('gap-3 flex flex-col', className)}>
      <Separator />
      <div className="flex justify-between items-center gap-3 px-1">
        <div className="flex items-center gap-3">
          <CommentIndicatorButton
            showAuthorComments={showAuthorComments}
            showReaderComments={showReaderComments}
            onShowAuthorCommentsChange={onShowAuthorCommentsChange}
            onShowReaderCommentsChange={onShowReaderCommentsChange}
          />
          {!editMode && statement.statementId && (
            <RebuttalButton
              existingStatementId={statement.statementId}
              existingTitle={statement.title || ''}
              existingThreadId={statement.threadId}
            />
          )}
          {statement.statementId && (
            <VoteButton statementId={statement.statementId} upvotes={statement.upvotes || []} />
          )}
        </div>
        <div className="flex items-center gap-3 w-full justify-end">
          {editMode ? (
            <ViewModeButton
              size="sm"
              handleEditModeToggle={handleEditModeToggle}
              className="w-full"
            />
          ) : (
            <>
              <ShareButton updatedStatement={statement} />
              {statement.creatorId === userId && (
                <CreatorOptionsButton
                  editMode={editMode}
                  handleEditModeToggle={handleEditModeToggle}
                  handleDelete={handleDelete}
                />
              )}
            </>
          )}
        </div>
      </div>
      {editMode && (
        <div className="flex flex-col gap-2 bg-muted p-2 rounded-md">
          <div className="flex justify-between items-center gap-1 ">
            <div className="text-sm text-muted-foreground">
              {`conject.com/${statement.creatorSlug}/`}
            </div>
            <Input
              className="bg-background h-8"
              defaultValue={statement.slug || ''}
              onChange={(e) => {
                setSlug(e.target.value);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-1"
              disabled={buttonState === 'loading'}
              onClick={() => handleUpdateSlug(slug)}
            >
              Update URL
            </Button>
          </div>
          {slugError && <div className="text-sm text-red-500">{slugError}</div>}
        </div>
      )}

      <Separator />
    </div>
  );
}

const CreatorOptionsButton = ({
  editMode,
  handleEditModeToggle,
  handleDelete
}: {
  editMode: boolean;
  handleEditModeToggle: () => void;
  handleDelete: () => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <BarChart3 className="mr-2 h-4 w-4" />
          Stats
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleEditModeToggle}>
          <PencilLine className="mr-2 h-4 w-4" />
          {editMode ? 'View' : 'Edit'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
