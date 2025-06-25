import { StatementPackage } from 'kysely-codegen';
import { BarChart3, CalendarClock, MoreHorizontal, PencilLine, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';
import {
  deleteStatement,
  updateDraftPublicationDate,
  updateStatementUrl
} from '@/lib/actions/statementActions';
import { checkValidStatementSlug } from '@/lib/helpers/helpersStatements';
import { cn } from '@/lib/utils';

import { ShareButton } from '../special_buttons/share_button';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
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
  statement: StatementPackage;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | null>(
    statement.draft.publishedAt ? new Date(statement.draft.publishedAt) : null
  );
  const { setUpdatedStatement } = useStatementContext();
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const { currentVersion } = useStatementContext();

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
      router.push(`/${statement.creatorSlug}/${slug}/${currentVersion}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('URL already exists')) {
        setSlugError('That URL is already taken');
      } else {
        console.error(error);
      }
      setButtonState('error');
    }
  };

  const handleUpdatePublicationDate = async (date: Date | null) => {
    if (!date) return;
    if (date > new Date()) {
      setCalendarError('Cannot set a future date');
      return;
    }
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      await updateDraftPublicationDate({
        id: statement.draft.id,
        statementSlug: statement.slug,
        creatorId: statement.creatorId,
        publishedAt: date,
        creatorSlug: statement.creatorSlug
      });
      setUpdatedStatement(prev => ({
        ...prev,
        publishedAt: date
      }));
      setCalendarDate(date);
      setDialogOpen(false);
      // Optionally, refresh or revalidate here
    } catch (e) {
      setCalendarError('Failed to update date');
    } finally {
      setCalendarLoading(false);
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
          {!editMode && statement.statementId && (
            <VoteButton statementId={statement.statementId} upvotes={statement.upvotes || []} />
          )}
        </div>
        <div className="flex items-center gap-3  justify-end">
          {editMode ? (
            <>
              <Link
                href={`/${statement.creatorSlug}/${statement.slug}/${currentVersion}/newsletter`}
              >
                <Button variant="outline" size="sm">
                  Preview newsletter
                </Button>
              </Link>
              <ViewModeButton
                size="sm"
                handleEditModeToggle={handleEditModeToggle}
                className="w-full"
              />
            </>
          ) : (
            <>
              <ShareButton updatedStatement={statement} />
              {statement.creatorId === userId && (
                <CreatorOptionsButton
                  editMode={editMode}
                  handleEditModeToggle={handleEditModeToggle}
                  handleDelete={handleDelete}
                  dialogOpen={dialogOpen}
                  setDialogOpen={setDialogOpen}
                  calendarDate={calendarDate}
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
              onChange={e => {
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-transparent border-none shadow-none p-0 max-w-fit"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Set Publication Date</DialogTitle>
          <Calendar
            mode="single"
            selected={calendarDate ?? undefined}
            onSelect={date => {
              if (!date || date > new Date()) return;
              // Only trigger if the day is different
              const prev = calendarDate;
              if (!prev || prev.toDateString() !== date.toDateString()) {
                setCalendarDate(date);
                handleUpdatePublicationDate(date);
                setDialogOpen(false);
              }
            }}
            className="rounded-md border shadow-sm"
            captionLayout="dropdown"
            disabled={date => date > new Date()}
          />
          {calendarError && <div className="text-sm text-red-500 mt-1">{calendarError}</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const CreatorOptionsButton = ({
  editMode,
  handleEditModeToggle,
  handleDelete,
  setDialogOpen,
  calendarDate
}: {
  editMode: boolean;
  handleEditModeToggle: () => void;
  handleDelete: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  calendarDate: Date | null;
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
        <DropdownMenuItem onClick={() => setDialogOpen(true)}>
          <CalendarClock className="mr-2 h-4 w-4" />
          Published on
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
