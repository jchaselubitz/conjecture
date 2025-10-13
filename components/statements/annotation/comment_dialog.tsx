import { AnnotationWithComments } from 'kysely-codegen';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import CommentInput from './comment_input';

interface CommentDialogProps {
  showCommentInput: boolean;
  setShowCommentInput: React.Dispatch<React.SetStateAction<boolean>>;
  selectedAnnotation: AnnotationWithComments;
}

export default function CommentDialog({
  showCommentInput,
  setShowCommentInput,
  selectedAnnotation
}: CommentDialogProps) {
  if (!selectedAnnotation) return null;
  return (
    <Dialog open={showCommentInput} onOpenChange={setShowCommentInput}>
      <DialogTitle className="sr-only">Comments</DialogTitle>
      <DialogContent
        className="p-3 pt-6 top-2 left-1 right-1 mx-auto bottom-0 translate-x-0 translate-y-0 max-w-[calc(100%-1rem)] h-fit max-h-[40dvh] "
        showCloseButton={false}
      >
        <div className="w-full  bottom-2 p-2">
          {selectedAnnotation && (
            <CommentInput
              showCommentInput={showCommentInput}
              setShowCommentInput={setShowCommentInput}
              annotation={selectedAnnotation}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
