import * as Sentry from '@sentry/nextjs';
import { AnnotationWithComments } from 'kysely-codegen';
import { NewAnnotation } from 'kysely-codegen';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { deleteAnnotation } from '@/lib/actions/annotationActions';
import { formatDate } from '@/lib/helpers/helpersDate';
interface AnnotationHeaderProps {
  annotation: AnnotationWithComments;
  isCreator: boolean;
}

export default function AnnotationHeader({ annotation, isCreator }: AnnotationHeaderProps) {
  const { editor, updatedStatement } = useStatementContext();
  const editable = editor?.isEditable;
  const { setAnnotations, setSelectedAnnotationId } = useStatementAnnotationContext();
  const [deletingButtonState, setDeletingButtonState] = useState<ButtonLoadingState>('default');

  const handleDeleteAnnotation = async () => {
    setDeletingButtonState('loading');
    const annotationId = annotation.id;
    if (!annotationId) return;

    try {
      if (editor) {
        await deleteAnnotation({
          annotationId: annotation.id,
          statementCreatorId: updatedStatement?.creatorId,
          annotationCreatorId: annotation.userId,
          statementId: annotation.draftId
        });

        editor.commands.deleteAnnotationHighlight(annotationId);
        setAnnotations((prevAnnotations: AnnotationWithComments[]) =>
          prevAnnotations.filter((a) => a.id !== annotationId)
        );

        setDeletingButtonState('success');
      } else {
        throw new Error('Editor not found');
      }
      setSelectedAnnotationId(undefined);
    } catch (error) {
      console.error('Error deleting annotation:', error);
      Sentry.captureException(error);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {annotation.text && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm italic line-clamp-2">{`"${annotation.text}"`}</p>
        </div>
      )}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <Avatar className="border">
            <AvatarImage src={annotation.userImageUrl} className="object-cover" />
            <AvatarFallback>{annotation.userName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{annotation.userName || 'User'}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate({
                date: new Date(annotation.createdAt),
                withTime: true
              })}
            </p>
          </div>
        </div>

        {isCreator && editable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <LoadingButton
                  buttonState={deletingButtonState}
                  onClick={handleDeleteAnnotation}
                  text={<Trash2 className="w-4 h-4" color="red" />}
                  variant="ghost"
                  size="sm"
                  loadingText={<RefreshCw className="w-4 h-4 animate-spin" />}
                  successText="Deleted"
                  errorText="Error deleting annotation"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete annotation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
