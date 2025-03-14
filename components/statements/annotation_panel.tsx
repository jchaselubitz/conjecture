"use client";

import { AnnotationWithComments } from "kysely-codegen";
import { X } from "lucide-react";
import { useStatementContext } from "@/contexts/statementContext";

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
}

export default function AnnotationPanel({
  annotations,
  handleCloseAnnotationPanel,
  statementId,
  statementCreatorId,
  selectedAnnotationId,
  setSelectedAnnotationId,
}: AnnotationPanelProps) {
  const { setAnnotations } = useStatementContext();

  const handleDeleteAnnotation = (annotationId: string) => {
    setAnnotations(annotations.filter((a) => a.id !== annotationId));
    setSelectedAnnotationId(undefined);
    localStorage.removeItem("selectedAnnotationId");
  };

  const sortedAnnotations = annotations.sort((a, b) => {
    return a.start - b.start;
  });

  return (
    <div className="flex flex-col mt-8 gap-6 mx-auto max-w-9/10 ">
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
        <div className="flex flex-col gap-3">
          {sortedAnnotations.map((annotation) => (
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
