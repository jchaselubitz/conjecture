import { AnnotationWithComments } from 'kysely-codegen';
import { RefreshCw, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { formatDate } from '@/lib/helpers/helpersDate';
interface AnnotationHeaderProps {
  annotation: AnnotationWithComments;
  isCreator: boolean;
  isMobile: boolean;
  handleDeleteAnnotation: () => void;
  deletingButtonState: ButtonLoadingState;
}

export default function AnnotationHeader({
  annotation,
  isCreator,
  isMobile,
  handleDeleteAnnotation,
  deletingButtonState
}: AnnotationHeaderProps) {
  const { editor } = useStatementContext();
  const editable = editor?.isEditable;

  return (
    <div className="flex flex-col gap-3 w-full">
      {annotation.text && (
        <div className="bg-muted p-3 rounded-md w-full">
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

        {isCreator && editable && isMobile && (
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
      </div>{' '}
    </div>
  );
}
