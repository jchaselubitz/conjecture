import { BaseStatementVote, DraftWithAnnotations } from "kysely-codegen";
import {
  ArrowUp,
  BarChart3,
  Eye,
  Facebook,
  Link,
  Linkedin,
  MessageCircle,
  MoreHorizontal,
  PencilLine,
  Send,
  Share2,
  Twitter,
} from "lucide-react";
import { startTransition, useOptimistic } from "react";
import { useUserContext } from "@/contexts/userContext";
import { toggleStatementUpvote } from "@/lib/actions/statementActions";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Tooltip } from "../ui/tooltip";
import { TooltipProvider } from "../ui/tooltip";
import { CommentIndicatorButton } from "./comments_menu";

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
  className,
}: StatementOptionsProps) {
  const { userId } = useUserContext();

  const [optVotes, setOptVotes] = useOptimistic<
    BaseStatementVote[],
    BaseStatementVote[]
  >(statement.upvotes, (current, updated) => {
    return updated;
  });

  const voteCount = optVotes?.length || 0;
  const hasUpvoted = optVotes?.some((vote) => vote.userId === userId) || false;

  const handleVote = async () => {
    if (!userId) return;
    try {
      const newVotes = hasUpvoted
        ? optVotes.filter((vote) => vote.userId !== userId)
        : [
            ...optVotes,
            {
              id: crypto.randomUUID(),
              userId,
              statementId: statement.statementId,
              createdAt: new Date(),
            },
          ];
      startTransition(() => {
        setOptVotes(newVotes);
      });

      await toggleStatementUpvote({
        statementId: statement.statementId,
        isUpvoted: hasUpvoted,
      });
    } catch (error) {
      console.error("Error upvoting comment:", error);
    } finally {
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Separator />
      <div className="flex justify-between items-center gap-3 px-1">
        <div className="flex items-center gap-3">
          <CommentIndicatorButton
            showAuthorComments={showAuthorComments}
            showReaderComments={showReaderComments}
            onShowAuthorCommentsChange={onShowAuthorCommentsChange}
            onShowReaderCommentsChange={onShowReaderCommentsChange}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasUpvoted ? "default" : "outline"}
                  size="sm"
                  onClick={handleVote}
                  className=" text-xs opacity-70 hover:opacity-100 hover:cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3 " />
                  {voteCount > 0 && voteCount}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasUpvoted ? "Remove upvote" : "Upvote comment"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-3 w-full justify-end">
          {editMode ? (
            <ViewModeButton
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
                />
              )}
            </>
          )}
        </div>
      </div>
      <Separator />
    </div>
  );
}

const ViewModeButton = ({
  handleEditModeToggle,
  className,
}: {
  handleEditModeToggle: () => void;
  className?: string;
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEditModeToggle}
      className={className}
    >
      <Eye className="h-4 w-4" />
      Switch back to view mode
    </Button>
  );
};

const ShareButton = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 px-2">
          <Share2 className="h-4 w-4 mr-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          <Link className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Send className="mr-2 h-4 w-4" />
          Send as message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Facebook className="mr-2 h-4 w-4" />
          Share to Facebook
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Linkedin className="mr-2 h-4 w-4" />
          Share to LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem>
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
}: {
  editMode: boolean;
  handleEditModeToggle: () => void;
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
        <DropdownMenuItem onClick={handleEditModeToggle}>
          <PencilLine className="mr-2 h-4 w-4" />
          {editMode ? "View" : "Edit"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <BarChart3 className="mr-2 h-4 w-4" />
          Stats
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
