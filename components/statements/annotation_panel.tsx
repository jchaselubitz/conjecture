"use client";

import * as Sentry from "@sentry/nextjs";
import { AnnotationWithComments, BaseAnnotation } from "kysely-codegen";
import { X } from "lucide-react";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import { deleteAnnotation } from "@/lib/actions/annotationActions";

import { Accordion } from "../ui/accordion";
import { Button } from "../ui/button";
import AnnotationDetail from "./annotation_detail";
interface AnnotationPanelProps {
  annotations: AnnotationWithComments[];
  handleCloseAnnotationPanel: () => void;
  statementId: string;
  statementCreatorId: string;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  showAuthorComments: boolean;
  showReaderComments: boolean;
}

export default function AnnotationPanel({
  annotations,
  handleCloseAnnotationPanel,
  statementId,
  statementCreatorId,
  selectedAnnotationId,
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
}: AnnotationPanelProps) {
  const { setAnnotations, editor } = useStatementContext();
  const { userId } = useUserContext();

  const handleDeleteAnnotation = async (annotation: BaseAnnotation) => {
    const annotationId = annotation.id;
    if (!annotationId) return;
    setAnnotations(annotations.filter((a) => a.id !== annotationId));
    setSelectedAnnotationId(undefined);
    try {
      await deleteAnnotation({
        annotationId: annotation.id,
        statementCreatorId,
        annotationCreatorId: annotation.userId,
        statementId: annotation.draftId,
      });
      if (editor) {
        editor.commands.deleteAnnotationHighlight(annotationId);
      }
    } catch (error) {
      console.error("Error deleting annotation:", error);
      Sentry.captureException(error);
    }
    localStorage.removeItem("selectedAnnotationId");
  };

  const sortedAnnotations = annotations.sort((a, b) => {
    return a.start - b.start;
  });

  const filteredAnnotations = sortedAnnotations.filter((annotation) => {
    if (showAuthorComments && showReaderComments) {
      return true;
    } else if (showAuthorComments) {
      return annotation.userId === statementCreatorId;
    } else if (showReaderComments) {
      return annotation.userId !== statementCreatorId;
    }
  });

  return (
    <div className="flex flex-col mt-8 gap-6 mx-auto  ">
      <div className="flex justify-end">
        <Button variant="ghost" onClick={handleCloseAnnotationPanel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <Accordion
        type="single"
        collapsible
        value={selectedAnnotationId}
        onValueChange={(value) => setSelectedAnnotationId(value)}
      >
        <div className="flex flex-col gap-2 mx-auto max-w-11/12 ">
          {filteredAnnotations.map((annotation) => (
            <AnnotationDetail
              key={annotation.id}
              annotation={annotation as AnnotationWithComments}
              statementId={statementId}
              statementCreatorId={statementCreatorId}
              selectedAnnotationId={selectedAnnotationId}
              onDelete={handleDeleteAnnotation}
            />
          ))}
        </div>
      </Accordion>
    </div>
  );
}
