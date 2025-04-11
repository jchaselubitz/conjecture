'use client';

import { AnnotationWithComments } from 'kysely-codegen';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'react-use';
import AnnotationDetail from '@/components/statements/annotation/annotation_detail';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
interface AnnotationPanelProps {
  handleCloseAnnotationPanel: () => void;
  statementId: string;
  statementCreatorId: string;
  showAuthorComments: boolean;
  showReaderComments: boolean;
}

export default function AnnotationPanel({
  handleCloseAnnotationPanel,
  statementId,
  statementCreatorId,
  showAuthorComments,
  showReaderComments
}: AnnotationPanelProps) {
  const router = useRouter();
  const { annotations, selectedAnnotationId, setSelectedAnnotationId, setReplyToComment } =
    useStatementAnnotationContext();

  const filteredAnnotations = annotations.filter((annotation) => {
    if (showAuthorComments && showReaderComments) {
      return true;
    } else if (showAuthorComments) {
      return annotation.userId === statementCreatorId;
    } else if (showReaderComments) {
      return annotation.userId !== statementCreatorId;
    }
  });

  const handleAnnotationSelection = (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    setReplyToComment(null);
    const params = new URLSearchParams(window.location.search);
    //create fresh params
    params.set('annotation-id', annotationId);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // Use replaceState to avoid adding to history
    if (newUrl !== `${window.location.pathname}${window.location.search}`) {
      router.replace(newUrl, { scroll: false });
    }
  };

  const isMobile = useWindowSize().width < 768;

  if (isMobile) {
    return (
      <>
        <div className="flex overflow-x-scroll snap-x snap-mandatory">
          {filteredAnnotations.map((annotation) => (
            <AnnotationDetail
              key={annotation.id}
              annotation={annotation as AnnotationWithComments}
              statementId={statementId}
              statementCreatorId={statementCreatorId}
              selectedAnnotationId={selectedAnnotationId}
              handleAnnotationSelection={handleAnnotationSelection}
            />
          ))}
        </div>
      </>
    );
  } else {
    return (
      <div className="flex flex-col mt-4 gap-6 mx-auto overflow-auto w-full">
        <div className="flex justify-between mx-auto max-w-11/12 w-full items-center">
          <h2 className="text-lg font-bold">Comments</h2>
          <Button variant="ghost" onClick={handleCloseAnnotationPanel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Accordion
          type="single"
          collapsible
          value={selectedAnnotationId}
          onValueChange={(value) => handleAnnotationSelection(value)}
        >
          <div className="flex md:flex-col gap-2 mx-auto max-w-11/12 overflow-x-scroll">
            {filteredAnnotations.map((annotation) => (
              <AnnotationDetail
                key={annotation.id}
                annotation={annotation as AnnotationWithComments}
                statementId={statementId}
                statementCreatorId={statementCreatorId}
                selectedAnnotationId={selectedAnnotationId}
                handleAnnotationSelection={handleAnnotationSelection}
              />
            ))}
            <div className="h-20" />
          </div>
        </Accordion>
      </div>
    );
  }
}
