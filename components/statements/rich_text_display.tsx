"use client";
import { NewAnnotation } from "kysely-codegen";
import React, { useEffect, useMemo, useRef } from "react";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";

import HTMLSuperEditor from "./custom_editor/html_super_editor";
interface RichTextDisplayProps {
  placeholder?: string;
  annotations: NewAnnotation[];
  handleAnnotationClick: (annotationId: string) => void;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  editMode: boolean;
}

const RichTextDisplay: React.FC<RichTextDisplayProps> = React.memo(
  ({
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
    const { statement } = useStatementContext();

    // Keep track of previous edit mode to handle transitions
    const prevEditModeRef = useRef(editMode);
    useEffect(() => {
      if (prevEditModeRef.current && !editMode) {
      }
      prevEditModeRef.current = editMode;
    }, [editMode]);

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
          statement={statement}
          style={{ minHeight: "400px" }}
          existingAnnotations={annotations}
          userId={userId}
          onAnnotationClick={handleAnnotationClick}
          placeholder={placeholder}
          annotatable={!editMode && (authorCanAnnotate || readerCanAnnotate)}
          selectedAnnotationId={selectedAnnotationId}
          setSelectedAnnotationId={setSelectedAnnotationId}
          showAuthorComments={showAuthorComments}
          showReaderComments={showReaderComments}
          editMode={editMode}
        />
        <div className="h-14" />
      </div>
    );
  },
);

export default RichTextDisplay;
