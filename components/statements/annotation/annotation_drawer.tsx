import useEmblaCarousel from 'embla-carousel-react';
import { AnnotationWithComments, BaseCommentWithUser } from 'kysely-codegen';
import { Dispatch, SetStateAction, useCallback, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useStatementContext } from '@/contexts/StatementContext';
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
  const { visualViewport, setVisualViewport } = useStatementContext();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    dragFree: false
  });

  const onSelect = useCallback(() => {
    if (!emblaApi || !filteredAnnotations) return;
    const selectedIndex = emblaApi.selectedScrollSnap();
    const selectedAnnotation = filteredAnnotations[selectedIndex];
    if (selectedAnnotation) {
      handleAnnotationSelection(selectedAnnotation.id);
    }
  }, [emblaApi, filteredAnnotations, handleAnnotationSelection]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const drawerStyle = visualViewport
    ? { height: `${visualViewport * 0.7}px` }
    : { height: '70dvh' };

  return (
    <Drawer open={showAnnotationDrawer} onOpenChange={handleCloseAnnotationDrawer}>
      <DrawerContent style={drawerStyle} className="p-0">
        <DrawerTitle className="sr-only">Comments</DrawerTitle>
        {annotations && (
          <div className="relative h-full overflow-y-auto w-full">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {filteredAnnotations.map((annotation) => (
                  <div key={annotation.id} className="flex-[0_0_100%]">
                    <AnnotationDetailMobile
                      annotation={annotation}
                      statementCreatorId={statement.creatorId}
                      statementId={statement.statementId}
                      handleAnnotationSelection={handleAnnotationSelection}
                      nestedComments={nestComments(annotation.comments)}
                      setReplyToComment={setReplyToComment}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="sticky bottom-0 w-full mx-auto px-2 justify-center">
          {selectedAnnotation && (
            <CommentInput
              annotation={selectedAnnotation}
              replyToComment={replyToComment}
              onCancelReply={cancelReply}
              setComments={setComments}
              setReplyToComment={setReplyToComment}
              cancelReply={cancelReply}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
