"use client";

import * as Sentry from "@sentry/nextjs";
import { AnnotationWithComments, NewComment } from "kysely-codegen";
import { RefreshCw, Trash2 } from "lucide-react";
import React, { startTransition, useOptimistic, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserContext } from "@/contexts/userContext";
import { deleteAnnotation } from "@/lib/actions/annotationActions";
import { createComment } from "@/lib/actions/commentActions";
import { cn } from "@/lib/utils";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Card } from "../ui/card";
import { ButtonLoadingState, LoadingButton } from "../ui/loading-button";
interface AnnotationPanelProps {
  annotation: AnnotationWithComments;
  onDelete: (annotationId: string) => void;
  statementCreatorId: string;
  statementId: string;
  selectedAnnotationId: string | undefined;
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  annotation,
  onDelete,
  statementCreatorId,
  statementId,
  selectedAnnotationId,
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
  const onCollapse = () => {};

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
      // setDeletingButtonState("success");
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

  const selected = selectedAnnotationId === annotation.id;
  const firstComment = optComments[0];
  return (
    <AccordionItem value={annotation.id} className="border-0">
      <Card
        className={cn(
          "p-0 hover:shadow-md ",
          selected ? "shadow-2xl" : "shadow-none"
        )}
      >
        <AccordionTrigger className={cn("p-4 hover:no-underline")}>
          <div className="flex flex-col gap-3">
            {firstComment && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm italic ">{`"${firstComment.content}"`}</p>
              </div>
            )}

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
          </div>
        </AccordionTrigger>

        <AccordionContent className="flex flex-col px-4 pb-4 gap-3">
          {optComments.map((comment) => (
            <div key={comment.id}>{comment.content}</div>
          ))}

          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[80px] focus-visible:ring-0"
          />

          <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-2">
              <LoadingButton
                buttonState={submittingButtonState}
                onClick={handleSubmitComment}
                text="Submit"
                loadingText="Submitting..."
                successText="Submitted"
                errorText="Error submitting comment"
              />
              <Button variant="outline" onClick={onCollapse}>
                Cancel
              </Button>
            </div>

            {isCreator && (
              <LoadingButton
                buttonState={deletingButtonState}
                onClick={handleDeleteAnnotation}
                text={<Trash2 className="w-4 h-4" />}
                variant="destructive"
                loadingText={<RefreshCw className="w-4 h-4" />}
                successText="Deleted"
                errorText="Error deleting annotation"
              />
            )}
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};

export default AnnotationPanel;
