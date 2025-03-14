import { NewAnnotation, AnnotationWithComments } from "kysely-codegen";
import React, { useState } from "react";

import { useUserContext } from "@/contexts/userContext";
import { createAnnotation } from "@/lib/actions/annotationActions";
import { getCommentsForAnnotation } from "@/lib/actions/commentActions";
import HTMLTextAnnotator from "./html_text_annotator";
import AnnotationComment from "./annotation_comment";
import { v4 as uuidv4 } from "uuid";

interface RichTextDisplayProps {
  htmlContent: string;
  placeholder?: string;
  readOnly?: boolean;
  draftId: string;
  statementId: string;
  statementCreatorId: string;
  annotations: NewAnnotation[];
  setAnnotations: (annotations: NewAnnotation[]) => void;
}

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  htmlContent,
  draftId,
  statementId,
  statementCreatorId,
  annotations,
  setAnnotations,
  placeholder = "Start typing or paste content here...",
  readOnly = false,
}) => {
  const { userId } = useUserContext();
  const [selectedAnnotationId, setSelectedAnnotation] = useState<
    string | undefined
  >(undefined);

  const selectedAnnotation = annotations.find(
    (a) => a.id === selectedAnnotationId
  );

  const [isCommentOpen, setIsCommentOpen] = useState(false);

  const handleAnnotationChange = async (value: NewAnnotation[]) => {
    if (!userId) {
      throw new Error("User ID is required");
    }
    const recent = value[value.length - 1];
    const annotation = {
      tag: recent.tag,
      text: recent.text,
      start: recent.start,
      end: recent.end,
      userId: userId,
      draftId: draftId,
      id: uuidv4(),
    };

    setAnnotations([...annotations, annotation as unknown as NewAnnotation]);

    if (!userId) {
      throw new Error("User ID is required");
    }

    await createAnnotation({ annotation, statementId: statementId });
  };

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

  const handleAnnotationClick = async (annotationId: string) => {
    setSelectedAnnotation(annotationId);
    setIsCommentOpen(true);
  };

  const handleDeleteAnnotation = (annotationId: string) => {
    setAnnotations(annotations.filter((a) => a.id !== annotationId));
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg overflow-hidden bg-background p-4">
        <HTMLTextAnnotator
          htmlContent={htmlContent}
          value={annotations}
          userId={userId}
          onClick={handleAnnotationClick}
          onChange={handleAnnotationChange}
          getSpan={getSpan}
          placeholder={placeholder}
          annotatable={!readOnly}
        />
      </div>
      <div className="editor-controls">
        <div className="ml-4">
          <span className="text-sm text-gray-600">
            {annotations.length} annotation
            {annotations.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {selectedAnnotation && (
        <AnnotationComment
          annotation={selectedAnnotation as AnnotationWithComments}
          statementId={statementId}
          statementCreatorId={statementCreatorId}
          isOpen={isCommentOpen}
          onClose={() => setIsCommentOpen(false)}
          onDelete={handleDeleteAnnotation}
        />
      )}
    </div>
  );
};

export default RichTextDisplay;
