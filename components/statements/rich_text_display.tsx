"use client";
import { NewAnnotation } from "kysely-codegen";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import { createAnnotation } from "@/lib/actions/annotationActions";
import { generateStatementId } from "@/lib/helpers/helpersStatements";

import HTMLSuperEditor from "./custom_editor/html_super_editor";
interface RichTextDisplayProps {
  htmlContent: string;
  placeholder?: string;
  readOnly?: boolean;
  draftId: string;
  statementId: string;
  statementCreatorId: string;
  annotations: NewAnnotation[];
  handleAnnotationClick: (annotationId: string) => void;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  editable: boolean;
}

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  htmlContent,
  draftId,
  statementId,
  handleAnnotationClick,
  annotations,
  selectedAnnotationId,
  placeholder = "Start typing or paste content here...",
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
  editable,
}) => {
  const { userId } = useUserContext();
  const {
    setAnnotations,
    statement,
    setStatementUpdate,
    statementUpdate,
    updateStatementDraft,
  } = useStatementContext();

  const prevStatementRef = useRef(statementUpdate);
  // Keep track of previous edit mode to handle transitions
  const prevEditModeRef = useRef(editable);

  const prepStatementId = statementId ? statementId : generateStatementId();

  // When edit mode changes, update the ref
  useEffect(() => {
    // When switching from edit to view mode, ensure we don't
    // have any pending state updates that could cause DOM issues
    if (prevEditModeRef.current && !editable) {
      // We're transitioning from edit to view mode
      // Any cleanup could be done here
    }

    // Update the ref
    prevEditModeRef.current = editable;
  }, [editable]);

  const handleContentChange = useCallback(
    (content: string) => {
      if (statement && content !== statement.content) {
        // Use type-safe update function instead
        setStatementUpdate({
          content,
          statementId: prepStatementId,
        });
      }
    },
    [statement, prepStatementId, setStatementUpdate],
  );

  useEffect(() => {
    if (editable && statementUpdate && prevStatementRef.current) {
      if (
        statementUpdate.title !== prevStatementRef.current.title ||
        statementUpdate.content !== prevStatementRef.current.content
      ) {
        const handler = setTimeout(() => {
          updateStatementDraft();
          prevStatementRef.current = statementUpdate;
        }, 1000);

        return () => {
          clearTimeout(handler);
        };
      }
    } else if (statementUpdate) {
      // Initialize the ref if it's empty
      prevStatementRef.current = statementUpdate;
    }
  }, [statementUpdate, updateStatementDraft, editable]);

  const handleAnnotationChange = async (value: NewAnnotation[]) => {
    if (!userId) {
      throw new Error("User ID is required");
    }
    const recent = value[value.length - 1];
    if (!recent.id) {
      throw new Error("Annotation ID is required");
    }
    const annotation = {
      tag: recent.tag,
      text: recent.text,
      start: recent.start,
      end: recent.end,
      userId: userId,
      draftId: draftId,
      id: recent.id,
    };

    setAnnotations([...annotations, annotation as unknown as NewAnnotation]);
    await createAnnotation({ annotation, statementId: statementId });
  };

  // const handleAnnotationUpdate = async (updatedAnnotation: NewAnnotation) => {
  //   if (!userId) {
  //     throw new Error("User ID is required");
  //   }
  //   if (!updatedAnnotation.id) {
  //     throw new Error("Annotation ID is required");
  //   }

  //   await updateAnnotation({
  //     annotation: {
  //       ...updatedAnnotation,
  //     },
  //     statementId: statementId,
  //   });
  // };

  const getSpan = (span: {
    start: number;
    end: number;
    text: string;
    id?: string | undefined;
    userId: string;
    draftId: string | number | bigint;
  }): NewAnnotation => {
    if (!draftId) {
      throw new Error("Draft ID is required");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }
    return {
      ...span,
      tag: "none",
      draftId: draftId.toString(),
      userId: userId,
    };
  };

  const isStatementCreator = useMemo(() => {
    return userId === statement?.creatorId;
  }, [userId, statement]);

  const authorCanAnnotate = useMemo(() => {
    return isStatementCreator && showAuthorComments;
  }, [isStatementCreator, showAuthorComments]);

  const readerCanAnnotate = useMemo(() => {
    return !isStatementCreator && showReaderComments;
  }, [isStatementCreator, showReaderComments]);

  return (
    <div className="rounded-lg overflow-hidden bg-background">
      <HTMLSuperEditor
        htmlContent={statementUpdate?.content || htmlContent}
        existingAnnotations={annotations}
        userId={userId}
        onAnnotationClick={handleAnnotationClick}
        onAnnotationChange={handleAnnotationChange}
        getSpan={getSpan}
        placeholder={placeholder}
        annotatable={authorCanAnnotate || readerCanAnnotate}
        selectedAnnotationId={selectedAnnotationId}
        setSelectedAnnotationId={setSelectedAnnotationId}
        showAuthorComments={showAuthorComments}
        showReaderComments={showReaderComments}
        onContentChange={handleContentChange}
        editable={editable}
        statementId={statementId}
      />
    </div>
  );
};

export default RichTextDisplay;
