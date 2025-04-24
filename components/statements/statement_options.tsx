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
              <ShareButton />
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

const ShareButton = () => {
  const { updatedStatement } = useStatementContext();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/[userSlug]/${updatedStatement.statementId}`
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
    const subject = encodeURIComponent(updatedStatement.title || 'Check out this statement');
    const body = encodeURIComponent(
      `I thought you might be interested in this statement:\n\n${shareUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSocialShare = (platform: 'facebook' | 'linkedin' | 'twitter') => {
    const text = encodeURIComponent(updatedStatement.title || 'Check out this statement');
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
