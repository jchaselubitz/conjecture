import useEmblaCarousel from 'embla-carousel-react';
import { AnnotationWithComments, BaseCommentWithUser } from 'kysely-codegen';
import { Dispatch, SetStateAction, useCallback, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerTitle, CommentDrawerContent } from '@/components/ui/drawer';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { nestComments } from '@/lib/helpers/helpersGeneral';
import { useFixedStyleWithIOsKeyboard } from 'react-ios-keyboard-viewport';
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

  // const drawerStyle = () => {
  //   if (visualViewport) {
  //     return { height: `${visualViewport}px` };
  //   } else {
  //     return { height: '70dvh' };
  //   }
  // };

  const { fixedTop, fixedCenter, fixedBottom } = useFixedStyleWithIOsKeyboard();

  console.log(fixedBottom);

  const drawerStyle = {
    ...fixedBottom
    // height: 'fit-content'
  };

  return (
    <Drawer open={showAnnotationDrawer} onOpenChange={handleCloseAnnotationDrawer}>
      <CommentDrawerContent className="pt-2 " handle={false} style={drawerStyle}>
        <DrawerTitle className="sr-only">Comments</DrawerTitle>

        <div className=" h-full overflow-y-auto w-full">
          <div className="overflow-hidden" ref={emblaRef}>
            {annotations && (
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
            )}
          </div>
        </div>

        <div className="sticky bottom-0 w-full justify-center bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
          <div className="w-full px-2 pt-2">
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
        </div>
      </CommentDrawerContent>
    </Drawer>
  );
}
