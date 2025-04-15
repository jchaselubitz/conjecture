import useEmblaCarousel from 'embla-carousel-react';
import { AnnotationWithComments, BaseCommentWithUser } from 'kysely-codegen';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { nestComments } from '@/lib/helpers/helpersGeneral';
import AnnotationDetailMobile from './ad_mobile';
import CommentInput from './comment_input';
import { Button } from '@/components/ui/button';

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
      <DrawerContent className="pt-2 h-[60dvh]" handle={false}>
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

        <div className="sticky bottom-0 z-60 w-full justify-center bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-fit">
          {showCommentInput ? (
            <div className="w-full px-2 pt-2">
              {selectedAnnotation && (
                <CommentInput
                  showCommentInput={showCommentInput}
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

  // if (!showAnnotationDrawer) {
  //   return <></>;
  // }

  // return (
  //   <div className="fixed inset-0 z-40 bg-black/50 overflow-hidden">
  //     <div
  //       className="fixed z-50 bottom-0 flex flex-col w-screen rounded-t-lg border-t pt-2 bg-background h-[70dvh] overflow-hidden"
  //       style={fixedBottom}
  //     >
  //       <div className="flex justify-end">
  //         <Button variant="ghost" size="icon" onClick={handleCloseAnnotationDrawer}>
  //           <X className="w-4 h-4" />
  //         </Button>
  //       </div>
  //       <div className="flex-1 overflow-y-auto">
  //         <div className="overflow-hidden" ref={emblaRef}>
  //           {annotations && (
  //             <div className="flex">
  //               {filteredAnnotations.map((annotation) => (
  //                 <div key={annotation.id} className="flex-[0_0_100%]">
  //                   <AnnotationDetailMobile
  //                     annotation={annotation}
  //                     statementCreatorId={statement.creatorId}
  //                     statementId={statement.statementId}
  //                     handleAnnotationSelection={handleAnnotationSelection}
  //                     nestedComments={nestComments(annotation.comments)}
  //                     setReplyToComment={setReplyToComment}
  //                   />
  //                 </div>
  //               ))}
  //             </div>
  //           )}
  //         </div>
  //       </div>

  //       <div
  //         className="sticky bottom-0 z-60 w-full justify-center bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  //         style={{
  //           // ...fixedBottom,
  //           height: 'fit-content'
  //         }}
  //       >
  //         <div className="w-full px-2 pt-2">
  //           {selectedAnnotation && (
  //             <CommentInput
  //               annotation={selectedAnnotation}
  //               replyToComment={replyToComment}
  //               onCancelReply={cancelReply}
  //               setComments={setComments}
  //               setReplyToComment={setReplyToComment}
  //               cancelReply={cancelReply}
  //             />
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}
