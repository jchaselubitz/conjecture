'use client';

import { AnnotationWithComments } from 'kysely-codegen';
import { ArrowRightToLineIcon } from 'lucide-react';

import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';

import AnnotationDetailDesktop from './ad_desktop';
interface AnnotationPanelProps {
  handleCloseAnnotationPanel: () => void;
  filteredAnnotations: AnnotationWithComments[];
  handleAnnotationSelection: (annotationId: string) => void;
  statementId: string;
  statementCreatorId: string;
  handleDeleteAnnotation: (annotation: AnnotationWithComments) => Promise<void>;
}

export default function AnnotationPanel({
  handleCloseAnnotationPanel,
  filteredAnnotations,
  handleAnnotationSelection,
  statementId,
  statementCreatorId,
  handleDeleteAnnotation
}: AnnotationPanelProps) {
  const { selectedAnnotationId } = useStatementAnnotationContext();

  return (
    <div className="flex flex-col mt-1 gap-6 mx-auto overflow-auto w-full">
      <div className="flex justify-between pl-4 w-full items-center">
        <h2 className="text-lg font-bold">Comments</h2>
        <Button variant="ghost" onClick={handleCloseAnnotationPanel}>
          <ArrowRightToLineIcon className="w-4 h-4" />
        </Button>
      </div>
      <Accordion
        type="single"
        collapsible
        value={selectedAnnotationId}
        onValueChange={value => handleAnnotationSelection(value)}
      >
        <div className="flex md:flex-col gap-2 mx-auto max-w-11/12 ">
          {filteredAnnotations.map(annotation => (
            <AccordionItem key={annotation.id} value={annotation.id} className="border-none">
              <AnnotationDetailDesktop
                key={annotation.id}
                annotation={annotation as AnnotationWithComments}
                statementId={statementId}
                selected={selectedAnnotationId === annotation.id}
                statementCreatorId={statementCreatorId}
                handleDeleteAnnotation={handleDeleteAnnotation}
              />
            </AccordionItem>
          ))}
          <div className="h-20" />
        </div>
      </Accordion>
    </div>
  );
}
