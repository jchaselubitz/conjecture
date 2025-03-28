// make a component that displays the options for the statement

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
import { startTransition, useOptimistic, useState } from "react";
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
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Tooltip } from "../ui/tooltip";
import { TooltipProvider } from "../ui/tooltip";

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

  if (editMode) {
    return (
      <ViewModeButton
        handleEditModeToggle={handleEditModeToggle}
        className="mb-5 w-full"
      />
    );
  }

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
        <div className="flex items-center">
          <ShareButton />
          {statement.creatorId === userId && (
            <CreatorOptionsButton
              editMode={editMode}
              handleEditModeToggle={handleEditModeToggle}
            />
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
      size="lg"
      onClick={handleEditModeToggle}
      className={className}
    >
      <Eye className="h-4 w-4" />
      Switch back to view mode
    </Button>
  );
};

const CommentIndicatorButton = ({
  showAuthorComments,
  showReaderComments,
  onShowAuthorCommentsChange,
  onShowReaderCommentsChange,
}: {
  showAuthorComments: boolean;
  showReaderComments: boolean;
  onShowAuthorCommentsChange: (checked: boolean) => void;
  onShowReaderCommentsChange: (checked: boolean) => void;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center min-w-24 gap-3"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comments</span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                " h-2 w-2 rounded-full border border-orange-500",
                showAuthorComments ? "bg-orange-500" : "bg-transparent"
              )}
            />
            <span
              className={cn(
                " h-2 w-2 rounded-full border border-blue-500",
                showReaderComments ? "bg-blue-500" : "bg-transparent"
              )}
            />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="flex flex-col gap-4 p-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="author-comments"
              checked={showAuthorComments}
              onCheckedChange={onShowAuthorCommentsChange}
              className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <Label
              htmlFor="author-comments"
              className="flex items-center gap-2"
            >
              Author comments
              <div className="h-2 w-2 rounded-full bg-orange-500" />
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="reader-comments"
              checked={showReaderComments}
              onCheckedChange={onShowReaderCommentsChange}
              className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label
              htmlFor="reader-comments"
              className="flex items-center gap-2"
            >
              Reader comments
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            </Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
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
