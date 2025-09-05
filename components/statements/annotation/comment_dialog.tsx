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
      <DialogContent className="p-3 pt-10 top-6 -translate-y-6 rounded-none max-w-screen h-full max-h-[60dvh]">
        <DialogTitle className="text-base font-medium max-h-32 overflow-y-auto">
          {selectedAnnotation.text}
        </DialogTitle>
        <div className="w-full absolute bottom-2 p-2">
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
