import { BaseAnnotation, NewAnnotation } from "kysely-codegen";
import React from "react";
import { Span } from "react-text-annotate/lib/span";
import { useUserContext } from "@/contexts/userContext";
import { createAnnotation } from "@/lib/actions/annotationActions";

import HTMLTextAnnotator from "./html_text_annotator";
interface RichTextDisplayProps {
  htmlContent: string;
  placeholder?: string;
  readOnly?: boolean;
  draftId: string;
  annotations: BaseAnnotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<BaseAnnotation[]>>;
}

interface AnnotationSpan extends Span {
  text: string;
  tag: string;
}

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  htmlContent,
  draftId,
  annotations,
  setAnnotations,
  placeholder = "Start typing or paste content here...",
  readOnly = false,
}) => {
  const { userId } = useUserContext();

  const handleAnnotationChange = async (value: AnnotationSpan[]) => {
    const recent = value[value.length - 1];
    const annotation = {
      tag: recent.tag,
      text: recent.text,
      start: recent.start,
      end: recent.end,
      userId: userId,
      draftId: draftId,
    } as NewAnnotation;

    setAnnotations([...annotations, annotation as unknown as BaseAnnotation]);

    if (!userId) {
      throw new Error("User ID is required");
    }

    await createAnnotation({ annotation });
  };

  const getSpan = (span: {
    start: number;
    end: number;
    text: string;
  }): AnnotationSpan => {
    return {
      ...span,
      tag: "none",
    };
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg overflow-hidden bg-background p-4">
        <HTMLTextAnnotator
          htmlContent={htmlContent}
          value={annotations}
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
    </div>
  );
};

export default RichTextDisplay;
