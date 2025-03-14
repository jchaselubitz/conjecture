"use client";

import React, {
  startTransition,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { useUserContext } from "@/contexts/userContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createComment } from "@/lib/actions/commentActions";
import {
  AnnotationWithComments,
  BaseComment,
  NewComment,
} from "kysely-codegen";
import { deleteAnnotation } from "@/lib/actions/annotationActions";
import { ButtonLoadingState, LoadingButton } from "../ui/loading-button";
import * as Sentry from "@sentry/nextjs";

interface AnnotationCommentProps {
  annotation: AnnotationWithComments;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (annotationId: string) => void;
  statementCreatorId: string;
  statementId: string;
}

const AnnotationComment: React.FC<AnnotationCommentProps> = ({
  annotation,
  isOpen,
  onClose,
  onDelete,
  statementCreatorId,
  statementId,
}) => {
  const { userId, userName } = useUserContext();
  const [commentText, setCommentText] = useState("");
  const [submittingButtonState, setSubmittingButtonState] =
    useState<ButtonLoadingState>("default");
  const [deletingButtonState, setDeletingButtonState] =
    useState<ButtonLoadingState>("default");

  const [optComments, setOptComments] = useOptimistic<NewComment[], NewComment>(
    annotation.comments,
    (prevComments, newComment) => {
      return [...prevComments, newComment];
    }
  );


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
      };

      startTransition(() => {
        setOptComments(newComment);
      });

      await createComment({ comment: newComment, statementId });
      setCommentText("");
      setSubmittingButtonState("success");
    } catch (error) {
      console.error("Error creating comment:", error);
      setSubmittingButtonState("error");
    } finally {
      setSubmittingButtonState("default");
    }
  };

  const handleDeleteAnnotation = async () => {
    if (!userId) return;

    setDeletingButtonState("loading");
    try {
      await deleteAnnotation({
        annotationId: annotation.id,
        statementCreatorId,
        annotationCreatorId: annotation.userId,
        statementId: annotation.draftId,
      });
      onDelete(annotation.id);
      onClose();
      setDeletingButtonState("success");
    } catch (error) {
      console.error("Error deleting annotation:", error);
      Sentry.captureException(error);
      setDeletingButtonState("error");
    } finally {
      setDeletingButtonState("default");
    }
  };

  const isCreator =
    userId === annotation.userId || userId === statementCreatorId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Annotation</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {/* Annotation text */}
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm italic">"{annotation.text}"</p>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {userName?.charAt(0) || userName?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-sm font-medium">
                {userName || userName || "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(annotation.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            {optComments.map((comment) => (
              <div key={comment.id}>{comment.content}</div>
            ))}
          </div>

          {/* Comment form */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div>
            {isCreator && (
              <LoadingButton
                buttonState={deletingButtonState}
                onClick={handleDeleteAnnotation}
                text="Delete Annotation"
                variant="destructive"
                loadingText="Deleting..."
                successText="Deleted"
                errorText="Error deleting annotation"
              />
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton
              buttonState={submittingButtonState}
              onClick={handleSubmitComment}
              text="Submit"
              loadingText="Submitting..."
              successText="Submitted"
              errorText="Error submitting comment"
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnnotationComment;
