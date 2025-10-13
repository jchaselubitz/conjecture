import useEmblaCarousel from 'embla-carousel-react';
import { AnnotationWithComments } from 'kysely-codegen';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { nestComments } from '@/lib/helpers/helpersComments';
import { cn } from '@/lib/utils';

import AnnotationDetailMobile from './ad_mobile';
import CommentDialog from './comment_dialog';

interface AnnotationDrawerProps {
  showAnnotationDrawer: boolean;
  handleCloseAnnotationDrawer: () => void;
  annotations: AnnotationWithComments[] | null;
  statement: {
    statementId: string;
    creatorId: string;
  };
  filteredAnnotations: AnnotationWithComments[];
  handleAnnotationSelection: (annotationId: string) => void;
  selectedAnnotation: AnnotationWithComments | null;
  handleDeleteAnnotation: (annotation: AnnotationWithComments) => Promise<void>;
}

export default function AnnotationDrawer({
  showAnnotationDrawer,
  handleCloseAnnotationDrawer,
  annotations,
  statement,
  filteredAnnotations,
  handleAnnotationSelection,
  selectedAnnotation,
  handleDeleteAnnotation
}: AnnotationDrawerProps) {
  const { replyToComment, setReplyToComment, cancelReply, comments } =
    useStatementAnnotationContext();

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRan, setEmblaRan] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    dragFree: false
  });

  useEffect(() => {
    if (!!replyToComment) {
      setShowCommentInput(true);
    }
  }, [replyToComment]);

  const onSelect = useCallback(() => {
    if (!emblaApi || !filteredAnnotations) return;
    const selectedIndex = emblaApi.selectedScrollSnap();
    const selectedAnnotation = filteredAnnotations[selectedIndex];
    if (selectedAnnotation) {
      setSelectedIndex(selectedIndex);
      setShowCommentInput(false);
      handleAnnotationSelection(selectedAnnotation.id);
    }
  }, [emblaApi, filteredAnnotations, handleAnnotationSelection]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    setEmblaRan(true);
    return () => {
      emblaApi.off('select', onSelect);
      setEmblaRan(false);
    };
  }, [emblaApi, onSelect, setEmblaRan]);

  useEffect(() => {
    if (selectedAnnotation && emblaApi && !emblaRan) {
      emblaApi?.scrollTo(filteredAnnotations.indexOf(selectedAnnotation), true);
    }
  }, [selectedAnnotation, emblaApi, filteredAnnotations, emblaRan]);

  const onCancelReply = () => {
    cancelReply();
    setShowCommentInput(false);
  };

  const onHandleCloseAnnotationDrawer = () => {
    handleCloseAnnotationDrawer();
    onCancelReply();
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  // console.log('selectedIndex', selectedIndex, filteredAnnotations);
  const canGoNext = () => {
    return selectedIndex < filteredAnnotations.length - 1;
  };

  const canGoPrevious = () => {
    return selectedIndex > 0;
  };

  return (
    <Drawer
      open={showAnnotationDrawer}
      repositionInputs={false}
      onOpenChange={onHandleCloseAnnotationDrawer}
      // direction="right"
    >
      <DrawerContent
        className={cn(
          'p-2 pt-0 min-h-[40dvh] h-full focus:outline-none'
          // showCommentInput ? 'max-h-[55dvh] translate-y-[65%]' : 'max-h-[90dvh] translate-y-[0%]'
        )}
        handle={true}
      >
        <DrawerTitle className="sr-only">Comments</DrawerTitle>

        <div className=" mt-2 overflow-y-auto min-h-2/3 h-full">
          <div className="overflow-hidden h-full" ref={emblaRef}>
            {annotations && (
              <div className="flex h-full">
                {filteredAnnotations.map(annotation => (
                  <div key={annotation.id} className="flex-[0_0_100%] h-full">
                    <AnnotationDetailMobile
                      annotation={annotation}
                      statementCreatorId={statement.creatorId}
                      statementId={statement.statementId}
                      nestedComments={nestComments(comments)}
                      setReplyToComment={setReplyToComment}
                      handleDeleteAnnotation={handleDeleteAnnotation}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 w-full z-60 justify-center bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-fit rounded-lg">
          <div className="w-full py-2 flex gap-2 items-center justify-between">
            <div className="w-24 flex pl-2">
              {canGoPrevious() && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollPrev}
                  className="h-8 w-fit text-muted-foreground flex justify-center items-center gap-2 "
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                  <span className="sr-only">Previous annotation</span>
                </Button>
              )}
            </div>
            {/* <Button
              variant="ghost"
              onClick={() => setShowCommentInput(true)}
              className="rounded-lg text-left text-muted-foreground justify-center w-fit"
            >
              Add comment <MessageCircle className="h-4 w-4" />
            </Button> */}
            <div className="w-24 flex justify-end pr-2 rounded-lg">
              {canGoNext() && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollNext}
                  className="h-8 w-fit text-muted-foreground flex justify-center items-center gap-2 "
                >
                  Next <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next annotation</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        <CommentDialog
          showCommentInput={showCommentInput}
          setShowCommentInput={setShowCommentInput}
          selectedAnnotation={selectedAnnotation as AnnotationWithComments}
        />
      </DrawerContent>
    </Drawer>
  );
}
