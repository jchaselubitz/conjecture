"use client";

import * as Sentry from "@sentry/nextjs";
import {
  AnnotationWithComments,
  BaseAnnotation,
  BaseCommentWithUser,
} from "kysely-codegen";
import { RefreshCw, Trash2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserContext } from "@/contexts/userContext";
import { createComment } from "@/lib/actions/commentActions";
import { formatDate } from "@/lib/helpers/helpersDate";
import { nestObject } from "@/lib/helpers/helpersGeneral";
import { cn } from "@/lib/utils";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";
import { ButtonLoadingState, LoadingButton } from "../ui/loading-button";
import Comment, { CommentWithReplies } from "./comment";

interface AnnotationDetailProps {
  annotation: AnnotationWithComments;
  onDelete: (annotation: BaseAnnotation) => void;
  statementCreatorId: string;
  statementId: string;
  selectedAnnotationId: string | undefined;
}

const AnnotationDetail: React.FC<AnnotationDetailProps> = ({
  annotation,
  onDelete,
  statementCreatorId,
  statementId,
  selectedAnnotationId,
}) => {
  const [comments, setComments] = useState<BaseCommentWithUser[]>(
    annotation.comments,
  );
  const selected = selectedAnnotationId === annotation.id;
  const annotationRef = useRef<HTMLDivElement>(null);

  const { userId } = useUserContext();
  const [deletingButtonState, setDeletingButtonState] =
    useState<ButtonLoadingState>("default");
  const [replyToComment, setReplyToComment] =
    useState<BaseCommentWithUser | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingButtonState, setSubmittingButtonState] =
    useState<ButtonLoadingState>("default");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setComments(annotation.comments);
  }, [annotation.comments]);

  useEffect(() => {
    if (selected && annotationRef.current) {
      annotationRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selected]);

  const handleDeleteAnnotation = async () => {
    if (!userId) return;

    setDeletingButtonState("loading");
    try {
      onDelete(annotation);
    } catch (error) {
      setDeletingButtonState("error");
      Sentry.captureException(error);
    } finally {
      setDeletingButtonState("default");
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !userId) return;

    setSubmittingButtonState("loading");
    try {
      // Create a temporary comment object with required fields for optimistic UI

      const newComment = {
        userId,
        annotationId: annotation.id,
        content: commentText,
        id: crypto.randomUUID(),
        parentId: replyToComment?.id,
      };

      // Update UI optimistically
      setComments((prevComments) => [
        ...prevComments,
        newComment as BaseCommentWithUser,
      ]);

      await createComment({
        comment: newComment,
        statementId,
        parentId: replyToComment?.id,
      });

      setCommentText("");
      setReplyToComment(null);
      setSubmittingButtonState("success");
    } catch (error) {
      console.error("Error creating comment:", error);
      setSubmittingButtonState("error");
      // Revert optimistic update on error
      setComments(annotation.comments);
    } finally {
      setSubmittingButtonState("default");
    }
  };

  const handleReplyClick = (comment: BaseCommentWithUser) => {
    setReplyToComment(comment);
    // Focus the textarea and scroll to it
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        commentInputRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  const cancelReply = () => {
    setReplyToComment(null);
  };

  const isCreator =
    userId === annotation.userId || userId === statementCreatorId;

  const handleCommentDeleted = (commentId: string) => {
    setComments((prevComments) =>
      prevComments.filter((comment) => comment.id !== commentId),
    );

    // If we were replying to this comment, cancel the reply
    if (replyToComment?.id === commentId) {
      setReplyToComment(null);
    }
  };

  // Organize comments into a tree structure

  const nestedComments = nestObject(comments) as CommentWithReplies[];

  // const firstComment = nestedComments.find((c) => !c.parentId);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }

    // Cancel reply on Escape
    if (e.key === "Escape" && replyToComment) {
      e.preventDefault();
      cancelReply();
    }
  };

  // const annotationText =
  //   annotation.text.length > 100
  //     ? annotation.text.substring(0, 100) + "..."
  //     : annotation.text;

  return (
    <AccordionItem value={annotation.id} className="border-0">
      <Card
        ref={annotationRef}
        className={cn(
          "p-0 gap-0",
          selected
            ? "shadow-2xl my-4 animate-ring-flash"
            : "shadow-none hover:shadow-md ",
        )}
      >
        <AccordionTrigger className={cn("p-4 hover:no-underline")}>
          <div className="flex flex-col gap-3 w-full">
            {annotation.text && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm italic line-clamp-2">{`"${annotation.text}"`}</p>
              </div>
            )}

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Avatar className="border ">
                  <AvatarImage
                    src={annotation.userImageUrl}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {annotation.userName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {annotation.userName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate({
                      date: new Date(annotation.createdAt),
                      withTime: true,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="flex flex-col px-4 pb-4 gap-3">
          {nestedComments.length > 0 && (
            <div className="border-b pb-1 border-muted">
              {nestedComments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  replies={(comment.children as CommentWithReplies[]) || []}
                  statementId={statementId}
                  statementCreatorId={statementCreatorId}
                  annotationId={annotation.id}
                  onReplyClick={handleReplyClick}
                  onCommentDeleted={handleCommentDeleted}
                  isRootComment={nestedComments[0]?.id === comment.id}
                />
              ))}
            </div>
          )}
          <div id="comment-input" className=" ">
            {replyToComment && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-md">
                <span className="text-xs flex-1 truncate">
                  Replying to:{" "}
                  <span className="font-medium italic">
                    {replyToComment.content.substring(0, 40)}
                    {replyToComment.content.length > 40 ? "..." : ""}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={cancelReply}
                  aria-label="Cancel reply"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <Textarea
              ref={commentInputRef}
              placeholder={
                replyToComment
                  ? "Write your reply..."
                  : "Share your thoughts..."
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] focus-visible:ring-0"
            />

            <div className="flex flex-row justify-between mt-2 gap-2">
              <div className="flex flex-row gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <LoadingButton
                        buttonState={submittingButtonState}
                        onClick={handleSubmitComment}
                        text={replyToComment ? "Reply" : "Comment"}
                        loadingText="Submitting..."
                        successText="Submitted"
                        errorText="Error"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {replyToComment
                          ? "Submit your reply"
                          : "Submit your comment"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCommentText("");
                          setReplyToComment(null);
                        }}
                      >
                        {commentText ? "Clear" : "Cancel"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {commentText ? "Clear comment text" : "Cancel reply"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="text-xs text-muted-foreground self-center">
                  Press <kbd className="px-1 py-0.5 bg-muted rounded">⇧</kbd>+
                  <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> for
                  new line
                </div>
              </div>

              {isCreator && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <LoadingButton
                        buttonState={deletingButtonState}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent accordion from toggling
                          handleDeleteAnnotation();
                        }}
                        text={<Trash2 className="w-4 h-4" color="red" />}
                        variant="ghost"
                        size="sm"
                        loadingText={
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        }
                        successText="Deleted"
                        errorText="Error deleting annotation"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete annotation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};

export default AnnotationDetail;
