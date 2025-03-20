"use client";
import { NewAnnotation } from "kysely-codegen";
import React, { useMemo } from "react";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import { createAnnotation } from "@/lib/actions/annotationActions";

import HTMLTextAnnotator from "./html_text_annotator";

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
}

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  htmlContent,
  draftId,
  statementId,
  handleAnnotationClick,
  annotations,
  selectedAnnotationId,
  placeholder = "Start typing or paste content here...",
  readOnly = false,
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
}) => {
  const { userId } = useUserContext();
  const { setAnnotations, statement } = useStatementContext();

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
      <HTMLTextAnnotator
        htmlContent={htmlContent}
        value={annotations}
        userId={userId}
        onClick={handleAnnotationClick}
        onChange={handleAnnotationChange}
        getSpan={getSpan}
        placeholder={placeholder}
        annotatable={authorCanAnnotate || readerCanAnnotate}
        selectedAnnotationId={selectedAnnotationId}
        setSelectedAnnotationId={setSelectedAnnotationId}
        showAuthorComments={showAuthorComments}
        showReaderComments={showReaderComments}
      />
    </div>
  );
};

export default RichTextDisplay;
