import useEmblaCarousel from 'embla-carousel-react';
import { AnnotationWithComments, BaseCommentWithUser } from 'kysely-codegen';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { nestComments } from '@/lib/helpers/helpersGeneral';

import AnnotationDetailMobile from './ad_mobile';
import CommentInput from './comment_input';

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
  replyToComment: BaseCommentWithUser | null;
  cancelReply: () => void;
  setComments: Dispatch<SetStateAction<BaseCommentWithUser[]>>;
  setReplyToComment: Dispatch<SetStateAction<BaseCommentWithUser | null>>;
}

export default function AnnotationDrawer({
  showAnnotationDrawer,
  handleCloseAnnotationDrawer,
  annotations,
  statement,
  filteredAnnotations,
  handleAnnotationSelection,
  selectedAnnotation,
  replyToComment,
  cancelReply,
  setComments,
  setReplyToComment
}: AnnotationDrawerProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [emblaRan, setEmblaRan] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    dragFree: false
  });

  useEffect(() => {
    if (replyToComment) {
      setShowCommentInput(true);
    }
  }, [replyToComment]);

  const onSelect = useCallback(() => {
    if (!emblaApi || !filteredAnnotations) return;
    const selectedIndex = emblaApi.selectedScrollSnap();
    const selectedAnnotation = filteredAnnotations[selectedIndex];
    if (selectedAnnotation) {
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

  return (
    <Drawer
      open={showAnnotationDrawer}
      repositionInputs={false}
      onOpenChange={onHandleCloseAnnotationDrawer}
    >
      <DrawerContent className="pt-2 h-[60dvh] focus:outline-none" handle={false}>
        <DrawerTitle className="sr-only">Comments</DrawerTitle>

        <div className="overflow-y-auto w-full ">
          <div className="overflow-hidden" ref={emblaRef}>
            {annotations && (
              <div className="flex ">
                {filteredAnnotations.map((annotation) => (
                  <div key={annotation.id} className="flex-[0_0_100%]">
                    <AnnotationDetailMobile
                      annotation={annotation}
                      statementCreatorId={statement.creatorId}
                      statementId={statement.statementId}
                      nestedComments={nestComments(annotation.comments)}
                      setReplyToComment={setReplyToComment}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 z-60 justify-center bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-fit">
          {showCommentInput ? (
            <div className="w-full px-2 pt-2">
              {selectedAnnotation && (
                <CommentInput
                  showCommentInput={showCommentInput}
                  setShowCommentInput={setShowCommentInput}
                  annotation={selectedAnnotation}
                  replyToComment={replyToComment}
                  onCancelReply={cancelReply}
                  setComments={setComments}
                  setReplyToComment={setReplyToComment}
                />
              )}
            </div>
          ) : (
            <div className="w-full px-2 py-2">
              <Button
                variant="ghost"
                onClick={() => setShowCommentInput(true)}
                className="w-full border-2 rounded-lg text-left text-muted-foreground justify-start"
              >
                Add comment
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
