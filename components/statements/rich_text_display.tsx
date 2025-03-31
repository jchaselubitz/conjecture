"use client";
import { DraftWithAnnotations, NewAnnotation } from "kysely-codegen";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import { generateStatementId } from "@/lib/helpers/helpersStatements";

import HTMLSuperEditor from "./custom_editor/html_super_editor";
interface RichTextDisplayProps {
  placeholder?: string;
  readOnly?: boolean;
  draftId: string;
  statementId: string;
  annotations: NewAnnotation[];
  handleAnnotationClick: (annotationId: string) => void;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  editMode: boolean;
}

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  draftId,
  statementId,
  handleAnnotationClick,
  annotations,
  selectedAnnotationId,
  placeholder = "Start typing or paste content here...",
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
  editMode,
}) => {
  const { userId } = useUserContext();
  const {
    statement,
    setStatementUpdate,
    statementUpdate,
    updateStatementDraft,
  } = useStatementContext();

  const prevStatementRef = useRef(statementUpdate);
  // Keep track of previous edit mode to handle transitions
  const prevEditModeRef = useRef(editMode);

  const prepStatementId = statementId ? statementId : generateStatementId();

  // When edit mode changes, update the ref
  useEffect(() => {
    // When switching from edit to view mode, ensure we don't
    // have any pending state updates that could cause DOM issues
    if (prevEditModeRef.current && !editMode) {
      // We're transitioning from edit to view mode
      // Any cleanup could be done here
    }
    // Update the ref
    prevEditModeRef.current = editMode;
  }, [editMode]);

  const handleContentChange = useCallback(
    (content: string) => {
      if (statement && content !== statement.content) {
        setStatementUpdate({
          content,
          statementId: prepStatementId,
        });
      }
    },
    [statement, prepStatementId, setStatementUpdate],
  );

  useEffect(() => {
    if (statementUpdate && prevStatementRef.current) {
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
  }, [statementUpdate, updateStatementDraft, editMode]);

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
        statement={statementUpdate as DraftWithAnnotations}
        style={{ minHeight: "400px" }}
        existingAnnotations={annotations}
        userId={userId}
        onAnnotationClick={handleAnnotationClick}
        placeholder={placeholder}
        annotatable={authorCanAnnotate || readerCanAnnotate}
        selectedAnnotationId={selectedAnnotationId}
        setSelectedAnnotationId={setSelectedAnnotationId}
        showAuthorComments={showAuthorComments}
        showReaderComments={showReaderComments}
        onContentChange={handleContentChange}
        editMode={editMode}
      />
      <div className="h-14" />
    </div>
  );
};

export default RichTextDisplay;
