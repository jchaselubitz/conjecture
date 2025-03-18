"use client";

import * as Sentry from "@sentry/nextjs";
import { BaseCommentWithUser } from "kysely-codegen";
import { ArrowUp, Edit2, RefreshCw, Reply, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/contexts/userContext";
import {
  deleteComment,
  editComment,
  toggleUpvote,
} from "@/lib/actions/commentActions";
import { formatDate } from "@/lib/helpers/helpersDate";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ButtonLoadingState, LoadingButton } from "../ui/loading-button";
import { Textarea } from "../ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
export type CommentWithReplies = BaseCommentWithUser & {
  children: BaseCommentWithUser[];
};

interface CommentProps {
  comment: CommentWithReplies;
  replies?: CommentWithReplies[];
  statementId: string;
  statementCreatorId: string;
  annotationId: string;
  onReplyClick: (comment: BaseCommentWithUser) => void;
  onCommentDeleted: (commentId: string) => void;
  level?: number;
  isRootComment?: boolean;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  replies = [],
  statementId,
  statementCreatorId,
  onReplyClick,
  onCommentDeleted,
  level = 0,
  isRootComment = false,
}) => {
  const { userId } = useUserContext();
  const [deletingButtonState, setDeletingButtonState] =
    useState<ButtonLoadingState>("default");
  const [editingComment, setEditingComment] = useState(false);
  const [commentContent, setCommentContent] = useState(comment.content);
  const [editingButtonState, setEditingButtonState] =
    useState<ButtonLoadingState>("default");
  const [isHovered, setIsHovered] = useState(false);

  const votes = comment.votes;
  const voteCount = votes?.length || 0;

  const handleEditComment = async () => {
    if (!userId) return;

    try {
      await editComment({
        id: comment.id,
        content: commentContent,
      });
    } catch (error) {
      console.error("Error editing comment:", error);
      setEditingButtonState("error");
    } finally {
      setEditingButtonState("default");
    }
  };

  const hasUpvoted = votes?.some((vote) => vote.userId === userId) || false;

  const handleVote = async () => {
    if (!userId) return;
    try {
      await toggleUpvote({
        commentId: comment.id,
        isUpvoted: hasUpvoted,
      });
    } catch (error) {
      console.error("Error upvoting comment:", error);
    } finally {
    }
  };

  const handleDeleteComment = async () => {
    if (!userId) return;

    setDeletingButtonState("loading");
    try {
      await deleteComment({
        id: comment.id,
        commenterId: comment.userId,
        statementCreatorId,
      });

      onCommentDeleted(comment.id);
    } catch (error) {
      console.error("Error deleting comment:", error);
      Sentry.captureException(error);
      setDeletingButtonState("error");
    } finally {
      setDeletingButtonState("default");
    }
  };

  const isModerator = userId === statementCreatorId;
  const isCreator = userId === comment.userId;
  const isCreatorOrModerator = isCreator || isModerator;
  const maxLevel = 7; // Maximum nesting level
  const currentLevel = Math.min(level, maxLevel);

  const borderColor = () => {
    switch (currentLevel) {
      case 0:
        return "border-zinc-50/50";
      case 1:
        return "border-zinc-100/50";
      case 2:
        return "border-zinc-200/50";
      case 3:
        return "border-zinc-300/50";
      case 4:
        return "border-zinc-400/50";
      case 5:
        return "border-zinc-500/50";
      case 6:
        return "border-zinc-600/50";
      case 7:
        return "border-zinc-700/50";
    }
  };

  const commentControls = () => {
    return (
      <div className="flex items-center gap-1">
        {!editingComment && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReplyClick(comment)}
                    className=" text-xs opacity-70 hover:opacity-100 hover:cursor-pointer"
                  >
                    <Reply className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reply to comment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {isCreator && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingComment(true)}
                      className=" text-xs opacity-70 hover:opacity-100 hover:cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit comment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hasUpvoted ? "default" : "ghost"}
                    size="sm"
                    onClick={handleVote}
                    className=" text-xs opacity-70 hover:opacity-100 hover:cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3 " />
                    {isHovered && voteCount > 0 && voteCount}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{hasUpvoted ? "Remove upvote" : "Upvote comment"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        {isCreatorOrModerator && !isRootComment && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <LoadingButton
                  buttonState={deletingButtonState}
                  onClick={handleDeleteComment}
                  text={<Trash2 className="w-3 h-3" />}
                  variant="ghost"
                  size="sm"
                  loadingText={<RefreshCw className="w-3 h-3 animate-spin" />}
                  successText="Deleted"
                  errorText="Error"
                  className="opacity-70 hover:opacity-100"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete comment</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        currentLevel > 0 && "ml-2 mt-2 pl-2 border-l-2",
        borderColor(),
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "p-3 rounded-md transition-colors flex flex-col gap-2",
          currentLevel === 0 ? "bg-background" : "bg-muted mb-2",
          isHovered && "bg-muted/80",
          !isRootComment && level === 0 && "mt-6",
        )}
      >
        {/* Comment header with user info */}

        <div className="flex items-center justify-between mb-2">
          {!isRootComment && (
            <div className="flex items-center space-x-2">
              {/* <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs"> */}
              <Avatar>
                <AvatarImage src={comment.userImageUrl} />
                <AvatarFallback>
                  {comment.userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col  text-primary font-semibold text-xs">
                <p className="text-xs font-medium">
                  {comment.userId === userId ? "You" : comment.userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate({
                    date: new Date(comment.createdAt),
                    withTime: true,
                  })}
                </p>
              </div>
            </div>
          )}

          {!isRootComment && commentControls()}
        </div>
        {editingComment ? (
          <div className="flex flex-col gap-2 mt-4">
            <Textarea
              defaultValue={comment.content}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full bg-white/70"
            />
            <div className="flex items-center gap-2">
              <LoadingButton
                buttonState={editingButtonState}
                onClick={handleEditComment}
                text="Save"
                variant="ghost"
                size="sm"
                loadingText="Saving..."
                successText="Saved"
                errorText="Error"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingComment(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}
        {/* Reply button */}
        {isRootComment && commentControls()}
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="mt-1">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              replies={(reply.children as CommentWithReplies[]) || []}
              statementId={statementId}
              statementCreatorId={statementCreatorId}
              annotationId={comment.annotationId}
              onReplyClick={onReplyClick}
              onCommentDeleted={onCommentDeleted}
              level={currentLevel + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
